import ExpoModulesCore
import Foundation
import WidgetKit

/// App → widget data path (PLAN 규칙 › 홈 위젯): widget.json in the App Group, then reload.
public class WidgetBridgeModule: Module {
  private let appGroup = "group.app.nuni.mood"

  public func definition() -> ModuleDefinition {
    Name("WidgetBridge")

    AsyncFunction("write") { (json: String) throws in
      guard let dir = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: self.appGroup) else {
        throw AppGroupUnavailable()
      }
      try json.write(to: dir.appendingPathComponent("widget.json"), atomically: true, encoding: .utf8)
      WidgetCenter.shared.reloadAllTimelines()
    }
  }
}

struct AppGroupUnavailable: Error, CustomStringConvertible {
  var description: String { "App Group container unavailable" }
}
