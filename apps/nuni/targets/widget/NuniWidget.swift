import SwiftUI
import WidgetKit

/// widget.json written by the app into the App Group (PLAN 규칙 › 홈 위젯). Strings arrive already
/// localized in the app's language, so the widget has no translations of its own.
struct WidgetPayload: Decodable {
  struct Day: Decodable { let date: String; let mood: Int? }
  struct Today: Decodable { let mood: Int; let date: String }
  struct Strings: Decodable { let tapToLog: String; let locked: String; let hidden: String; let weekTitle: String }
  let today: Today?
  let last7: [Day]
  let locale: String
  let locked: Bool
  let hidden: Bool
  let strings: Strings
  let updatedAt: Double
}

let appGroup = "group.app.nuni.mood"
let todayURL = URL(string: "nuni://entry/today?source=widget")!
/// The locked medium widget opens the paywall (A9 source `widget`).
let premiumURL = URL(string: "nuni://premium/widget")!

func loadPayload() -> WidgetPayload? {
  guard let dir = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroup),
        let data = try? Data(contentsOf: dir.appendingPathComponent("widget.json")) else { return nil }
  return try? JSONDecoder().decode(WidgetPayload.self, from: data)
}

func localDateKey(_ date: Date) -> String {
  let f = DateFormatter()
  f.calendar = Calendar(identifier: .gregorian)
  f.locale = Locale(identifier: "en_US_POSIX")
  f.dateFormat = "yyyy-MM-dd"
  return f.string(from: date)
}

struct NuniEntry: TimelineEntry {
  let date: Date
  let payload: WidgetPayload?
}

struct Provider: TimelineProvider {
  func placeholder(in context: Context) -> NuniEntry { NuniEntry(date: .now, payload: nil) }

  func getSnapshot(in context: Context, completion: @escaping (NuniEntry) -> Void) {
    completion(NuniEntry(date: .now, payload: loadPayload()))
  }

  /// Now, plus one entry at the next midnight so "today" clears without the app running.
  func getTimeline(in context: Context, completion: @escaping (Timeline<NuniEntry>) -> Void) {
    let payload = loadPayload()
    let midnight = Calendar.current.startOfDay(for: .now.addingTimeInterval(86_400))
    completion(Timeline(entries: [NuniEntry(date: .now, payload: payload), NuniEntry(date: midnight, payload: payload)], policy: .never))
  }
}

func moodImage(_ mood: Int) -> Image { Image("mood\(min(max(mood, 1), 5))") }

struct SmallView: View {
  let entry: NuniEntry
  var body: some View {
    if let p = entry.payload, p.hidden {
      Text(p.strings.hidden).font(.caption).foregroundStyle(Color("inkMuted")).multilineTextAlignment(.center)
    } else if let p = entry.payload, let today = p.today, today.date == localDateKey(entry.date) {
      moodImage(today.mood).resizable().scaledToFit().padding(8)
    } else {
      VStack(spacing: 6) {
        Image("mood3").resizable().scaledToFit().frame(width: 44, height: 44).opacity(0.5)
        Text(entry.payload?.strings.tapToLog ?? "").font(.caption).foregroundStyle(Color("deep"))
      }
    }
  }
}

struct MediumView: View {
  let entry: NuniEntry
  var body: some View {
    if let p = entry.payload, p.hidden || p.locked {
      Text(p.hidden ? p.strings.hidden : p.strings.locked)
        .font(.subheadline).foregroundStyle(Color("inkMuted")).multilineTextAlignment(.center)
    } else if let p = entry.payload {
      VStack(alignment: .leading, spacing: 8) {
        Text(p.strings.weekTitle).font(.caption).foregroundStyle(Color("inkMuted"))
        HStack(spacing: 6) {
          ForEach(p.last7, id: \.date) { day in
            VStack(spacing: 4) {
              if let mood = day.mood {
                moodImage(mood).resizable().scaledToFit().frame(height: 32)
              } else {
                Circle().strokeBorder(Color("line"), style: StrokeStyle(lineWidth: 1.5, dash: [3, 3])).frame(width: 28, height: 28)
              }
              Text(String(day.date.suffix(2))).font(.caption2).foregroundStyle(Color("inkMuted"))
            }
            .frame(maxWidth: .infinity)
          }
        }
      }
    }
  }
}

struct NuniWidgetView: View {
  @Environment(\.widgetFamily) var family
  let entry: NuniEntry
  var body: some View {
    Group {
      if family == .systemMedium { MediumView(entry: entry) } else { SmallView(entry: entry) }
    }
    .containerBackground(Color("$widgetBackground"), for: .widget)
    .widgetURL(isLockedMedium ? premiumURL : todayURL)
  }

  private var isLockedMedium: Bool {
    guard family == .systemMedium, let p = entry.payload else { return false }
    return p.locked && !p.hidden
  }
}

@main
struct NuniWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "NuniWidget", provider: Provider()) { entry in
      NuniWidgetView(entry: entry)
    }
    .configurationDisplayName("Nuni")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}
