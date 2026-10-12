import ExpoModulesCore
import Foundation

/// iCloud Drive backup for Nuni (PLAN 규칙 › iCloud 백업): the snapshot lives in the app's
/// ubiquity container under Documents/backup/ (backup.db, photos/, meta.json). No CloudKit.
public class ICloudBackupModule: Module {
  private let containerId = "iCloud.app.nuni.mood"
  private let fm = FileManager.default

  public func definition() -> ModuleDefinition {
    Name("ICloudBackup")

    /// False when the user is signed out of iCloud or the container is unavailable.
    AsyncFunction("isAvailable") { () -> Bool in
      return self.fm.ubiquityIdentityToken != nil && self.documentsURL() != nil
    }

    /// meta.json of the current backup, or nil when there is none.
    AsyncFunction("readMeta") { () throws -> String? in
      guard let backup = self.documentsURL()?.appendingPathComponent("backup") else { return nil }
      let meta = backup.appendingPathComponent("meta.json")
      try self.download(meta, timeout: 30)
      guard self.fm.fileExists(atPath: meta.path) else { return nil }
      return try String(contentsOf: meta, encoding: .utf8)
    }

    /// Writes a new backup next to the old one, then swaps it in, so a failed copy never
    /// leaves a half-written backup in place.
    AsyncFunction("backup") { (dbPath: String, photosPath: String, metaJson: String) throws in
      guard let docs = self.documentsURL() else { throw ICloudUnavailable() }
      let staging = docs.appendingPathComponent("backup-staging")
      let target = docs.appendingPathComponent("backup")
      try? self.fm.removeItem(at: staging)
      try self.fm.createDirectory(at: staging, withIntermediateDirectories: true)
      try self.fm.copyItem(at: URL(fileURLWithPath: dbPath), to: staging.appendingPathComponent("backup.db"))
      let photos = URL(fileURLWithPath: photosPath)
      if self.fm.fileExists(atPath: photos.path) {
        try self.fm.copyItem(at: photos, to: staging.appendingPathComponent("photos"))
      }
      try metaJson.write(to: staging.appendingPathComponent("meta.json"), atomically: true, encoding: .utf8)
      try? self.fm.removeItem(at: target)
      try self.fm.moveItem(at: staging, to: target)
    }

    /// Downloads the backup if iCloud evicted it, then replaces the local DB file and photos.
    /// The caller closes the database first and asks the user to restart afterwards.
    AsyncFunction("restore") { (dbPath: String, photosPath: String) throws in
      guard let backup = self.documentsURL()?.appendingPathComponent("backup") else { throw ICloudUnavailable() }
      let db = backup.appendingPathComponent("backup.db")
      try self.download(db, timeout: 120)
      let photos = backup.appendingPathComponent("photos")
      if let names = try? self.fm.contentsOfDirectory(atPath: photos.path) {
        for name in names { try self.download(photos.appendingPathComponent(name), timeout: 120) }
      }
      let localDb = URL(fileURLWithPath: dbPath)
      for suffix in ["", "-wal", "-shm"] {
        try? self.fm.removeItem(atPath: localDb.path + suffix)
      }
      try self.fm.copyItem(at: db, to: localDb)
      let localPhotos = URL(fileURLWithPath: photosPath)
      try? self.fm.removeItem(at: localPhotos)
      if self.fm.fileExists(atPath: photos.path) {
        try self.fm.copyItem(at: photos, to: localPhotos)
      }
    }
  }

  private func documentsURL() -> URL? {
    guard let root = fm.url(forUbiquityContainerIdentifier: containerId) else { return nil }
    let docs = root.appendingPathComponent("Documents")
    try? fm.createDirectory(at: docs, withIntermediateDirectories: true)
    return docs
  }

  /// Starts downloading an evicted iCloud file and waits until the local copy is current.
  private func download(_ url: URL, timeout: TimeInterval) throws {
    guard (try? url.resourceValues(forKeys: [.isUbiquitousItemKey]).isUbiquitousItem) == true else { return }
    try fm.startDownloadingUbiquitousItem(at: url)
    let deadline = Date().addingTimeInterval(timeout)
    while Date() < deadline {
      var fresh = url
      fresh.removeAllCachedResourceValues()
      let status = try? fresh.resourceValues(forKeys: [.ubiquitousItemDownloadingStatusKey]).ubiquitousItemDownloadingStatus
      if status == .current { return }
      Thread.sleep(forTimeInterval: 0.25)
    }
    throw ICloudDownloadTimeout()
  }
}

struct ICloudUnavailable: Error, CustomStringConvertible {
  var description: String { "iCloud container unavailable" }
}

struct ICloudDownloadTimeout: Error, CustomStringConvertible {
  var description: String { "iCloud download timed out" }
}
