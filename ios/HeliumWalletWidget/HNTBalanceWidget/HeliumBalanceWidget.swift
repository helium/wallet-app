import Intents
import SwiftUI
import WidgetKit

/**
 * EntryView for all 3 widget sizes
 */
struct HeliumBalanceWidgetEntryView: View {
    var entry: HNTBalanceWidgetProvider.Entry
    @Environment(\.widgetFamily) var family

    @ViewBuilder
    var body: some View {
        if #available(iOSApplicationExtension 16.0, *) {
            switch family {
            case .accessoryCorner:
                HeliumTickerAccessoryCornerView(entry: entry)
            case .accessoryCircular:
                HeliumTickerAccessoryCirclularView(entry: entry)
            case .accessoryRectangular:
                HeliumTickerAccessoryRectangularView(entry: entry)
            case .accessoryInline:
                HeliumTickerAccessoryInlineView(entry: entry)
            case .systemSmall:
                HeliumBalanceWidgetSmallView(entry: entry)
            default:
                HeliumBalanceWidgetSmallView(entry: entry)
            }
        } else {
            // Fallback on earlier versions
            switch family {
            case .systemSmall:
                HeliumBalanceWidgetSmallView(entry: entry)
            default:
                HeliumBalanceWidgetSmallView(entry: entry)
            }
        }
    }
}

struct HeliumBalanceWidget: Widget {
    let kind: String = "HeliumBalanceWidget"

    var body: some WidgetConfiguration {
        if #available(iOSApplicationExtension 16.0, *) {
            return IntentConfiguration(kind: kind, intent: ConfigurationIntent.self, provider: HNTBalanceWidgetProvider()) { entry in
                HeliumBalanceWidgetEntryView(entry: entry)
            }
            .configurationDisplayName(String(localized: "Balance_Widget_Title",
                                             comment: "Helium Balance widget display name."))
            .description(String(localized: "Balance_Widget_Description",
                                comment: "Helium Balance widget description.")).supportedFamilies([.accessoryCircular, .accessoryRectangular, .accessoryInline, .systemSmall])
        } else {
            // Fallback on earlier versions
            return IntentConfiguration(kind: kind, intent: ConfigurationIntent.self, provider: HNTBalanceWidgetProvider()) { entry in
                HeliumBalanceWidgetEntryView(entry: entry)
            }
            .configurationDisplayName(String(localized: "Balance_Widget_Title",
                                             comment: "Helium Balance widget display name."))
            .description(String(localized: "Balance_Widget_Description",
                                comment: "Helium Balance widget description.")).supportedFamilies([.systemSmall])
        }
    }
}

// DEBUGGING: Uncomment this to run preview with SwiftUI

// extension WidgetFamily: EnvironmentKey {
//
//    public static var defaultValue: WidgetFamily = .systemSmall
//
// }
//
// extension EnvironmentValues {
//
//  var widgetFamily: WidgetFamily {
//
//    get { self[WidgetFamily.self] }
//
//    set { self[WidgetFamily.self] = newValue }
//
//  }
//
// }
//
// struct HeliumBalanceWidget_Previews: PreviewProvider {
//   static var previews: some View {
//     let entry = BalanceWidgetEntry(date: Date(), configuration: ConfigurationIntent(), widgetData: Utils.mockHNTBalanceWidget())
//
//     Group {
//       if #available(iOSApplicationExtension 16.0, *) {
//         HeliumBalanceWidgetEntryView(entry: entry)
//           .previewContext(WidgetPreviewContext(family: .accessoryCircular)).previewDisplayName("Circular Widget").environment(\.widgetFamily, .accessoryCircular).environment(\.colorScheme, .light)
//         HeliumBalanceWidgetEntryView(entry: entry)
//           .previewContext(WidgetPreviewContext(family: .accessoryRectangular)).previewDisplayName("Rectangular Widget").environment(\.widgetFamily, .accessoryRectangular).environment(\.colorScheme, .light)
//         HeliumBalanceWidgetEntryView(entry: entry)
//           .previewContext(WidgetPreviewContext(family: .accessoryInline)).previewDisplayName("Inline Widget").environment(\.widgetFamily, .accessoryInline).environment(\.colorScheme, .light)
//       }
//       HeliumBalanceWidgetEntryView(entry: entry)
//         .previewContext(WidgetPreviewContext(family: .systemSmall)).previewDisplayName("Small Widget").environment(\.widgetFamily, .systemSmall).environment(\.colorScheme, .light)
//     }
//   }
// }
