//
//  HeliumWalletWidget.swift
//  HeliumWalletWidget
//
//  Created by Luis Perrone on 6/8/22.
//

import Intents
import SwiftUI
import WidgetKit

/**
 * EntryView for all 3 widget sizes
 */
struct HeliumWalletWidgetEntryView: View {
    var entry: Provider.Entry
    @Environment(\.widgetFamily) var family

    @ViewBuilder
    var body: some View {
        switch family {
        case .systemSmall:
            HeliumWalletWidgetSmallView(entry: entry)
        case .systemMedium:
            HeliumWalletWidgetMediumView(entry: entry)
        case .systemLarge:
            HeliumWalletWidgetLargeView(entry: entry)
        default:
            HeliumWalletWidgetSmallView(entry: entry)
        }
    }
}

/**
 * Config for wallet balance widget.
 */
struct HeliumWalletWidget: Widget {
    let kind: String = "HeliumWalletWidget"

    var body: some WidgetConfiguration {
        // Fallback on earlier versions
        return IntentConfiguration(kind: kind, intent: ConfigurationIntent.self, provider: Provider()) { entry in
            HeliumWalletWidgetEntryView(entry: entry)
        }
        .configurationDisplayName(String(localized: "Wallet_Widget_Title",
                                         comment: "Helium wallet widget title."))
        .description(String(localized: "Wallet_Widget_Description",
                            comment: "Helium wallet widget description.")).supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
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
//
// struct HeliumWalletWidget_Previews: PreviewProvider {
//    static var previews: some View {
//      let entry = WalletWidgetEntry(date: Date(), configuration: ConfigurationIntent(), widgetData: Utils.mockAccountDetails())
//      Group {
//        if #available(iOSApplicationExtension 16.0, *) {
//          HeliumWalletWidgetEntryView(entry: entry)
//            .previewContext(WidgetPreviewContext(family: .accessoryCircular)).previewDisplayName("Circular Widget").environment(\.widgetFamily, .accessoryCircular).environment(\.colorScheme, .light)
//          HeliumWalletWidgetEntryView(entry: entry)
//            .previewContext(WidgetPreviewContext(family: .accessoryRectangular)).previewDisplayName("Rectangular Widget").environment(\.widgetFamily, .accessoryRectangular).environment(\.colorScheme, .light)
//          HeliumWalletWidgetEntryView(entry: entry)
//            .previewContext(WidgetPreviewContext(family: .accessoryInline)).previewDisplayName("Inline Widget").environment(\.widgetFamily, .accessoryInline).environment(\.colorScheme, .light)
//        }
//        HeliumWalletWidgetEntryView(entry: entry)
//          .previewContext(WidgetPreviewContext(family: .systemSmall)).previewDisplayName("Small Widget").environment(\.widgetFamily, .systemSmall).environment(\.colorScheme, .light)
//        HeliumWalletWidgetEntryView(entry: entry)
//          .previewContext(WidgetPreviewContext(family: .systemMedium)).previewDisplayName("Medium Widget").environment(\.widgetFamily, .systemMedium).environment(\.colorScheme, .light)
//        HeliumWalletWidgetEntryView(entry: entry)
//          .previewContext(WidgetPreviewContext(family: .systemLarge)).previewDisplayName("Large Widget").environment(\.widgetFamily, .systemLarge).environment(\.colorScheme, .light)
//      }
//    }
// }
