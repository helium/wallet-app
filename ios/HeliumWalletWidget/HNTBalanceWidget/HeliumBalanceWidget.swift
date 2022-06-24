import Intents
import SwiftUI
import WidgetKit

struct HeliumBalanceWidget: Widget {
    let kind: String = "HeliumBalanceWidget"

    var body: some WidgetConfiguration {
        IntentConfiguration(kind: kind, intent: ConfigurationIntent.self, provider: HNTBalanceWidgetProvider()) { entry in
            HeliumBalanceWidgetEntryView(entry: entry)
        }
        .configurationDisplayName(String(localized: "Balance_Widget_Title",
                                         comment: "Helium Balance widget display name."))
        .description(String(localized: "Balance_Widget_Description",
                            comment: "Helium Balance widget description.")).supportedFamilies([.systemSmall])
    }
}

// Rendering preview for SwiftUI preview
struct HeliumBalanceWidget_Previews: PreviewProvider {
    static var previews: some View {
        HeliumBalanceWidgetEntryView(entry: BalanceWidgetEntry(date: Date(), configuration: ConfigurationIntent(), hntPrice: 50.41234, hntDailyEarnings: 52.37, balance: 1_500_000))
            .previewContext(WidgetPreviewContext(family: .systemSmall))
    }
}
