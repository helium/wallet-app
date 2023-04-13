import Intents
import SwiftUI
import WidgetKit


struct BalanceWidgetEntry: TimelineEntry {
    let date: Date
    let configuration: ConfigurationIntent
    let widgetData: WidgetData
}

class BalanceEntryCache {
    var previousEntry: BalanceWidgetEntry?
}

// Helium Balance Widget Provider that determines placeholder, snapshot, and timeline for this widget.
struct HNTBalanceWidgetProvider: IntentTimelineProvider {
    private let entryCache = BalanceEntryCache()

    func placeholder(in _: Context) -> BalanceWidgetEntry {
      BalanceWidgetEntry(date: Date(), configuration: ConfigurationIntent(), widgetData: Utils.mockHNTBalanceWidget())
    }

    func getSnapshot(for _: ConfigurationIntent, in _: Context, completion: @escaping (BalanceWidgetEntry) -> Void) {
        let entry = BalanceWidgetEntry(date: Date(), configuration: ConfigurationIntent(), widgetData: Utils.mockHNTBalanceWidget())
        completion(entry)
    }

    func getTimeline(for configuration: ConfigurationIntent, in _: Context, completion: @escaping (Timeline<BalanceWidgetEntry>) -> Void) {
        let userDefaults = UserDefaults(suiteName: "group.com.helium.mobile.wallet.widget")
        if userDefaults != nil {
            let entryDate = Date()
            if let savedData = userDefaults!.value(forKey: "heliumWalletWidgetKey") as? String {
                let decoder = JSONDecoder()
                let data = savedData.data(using: .utf8)
                if let parsedData = try? decoder.decode(HeliumWalletWidgetData.self, from: data!) {
                    // Fetch balance data from nova wallet API.
                  Network().fetchWidgetData(address: parsedData.defaultAccountAddress, cluster: parsedData.cluster, currency: parsedData.currencyType) { _, widgetData in
                        let nextRefresh = Calendar.current.date(byAdding: .minute, value: 15, to: entryDate)!
                        if let widgetData = widgetData {
                          let entry = BalanceWidgetEntry(date: nextRefresh, configuration: configuration, widgetData: widgetData)
                            let timeline = Timeline(entries: [entry], policy: .atEnd)
                            entryCache.previousEntry = entry
                            completion(timeline)
                        }
                    }
                }
            } else {
                let nextRefresh = Calendar.current.date(byAdding: .minute, value: 5, to: entryDate)!
              let entry = BalanceWidgetEntry(date: nextRefresh, configuration: configuration, widgetData: Utils.emptyHNTBalanceWidgetDetails())
                let fallback = entryCache.previousEntry ?? entry
                let timeline = Timeline(entries: [fallback], policy: .atEnd)
                completion(timeline)
            }
        }
    }
}
