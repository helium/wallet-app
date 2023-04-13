//
//  HeliumWalletWidgetProvider.swift
//  HeliumWalletWidgetExtension
//
//  Created by Luis Perrone on 6/9/22.
//

import Intents
import SwiftUI
import WidgetKit

// Widget Data being injected via app groups.
struct HeliumWalletWidgetData: Decodable {
    let defaultAccountAddress: String
    let cluster: String
    let defaultAccountAlias: String
    let currencyType: String
}

// WidgetEntry extending from TimelineEntry in order to refresh based on date.
struct WalletWidgetEntry: TimelineEntry {
    var date: Date
    var configuration: ConfigurationIntent
    var widgetData: WidgetChartData
}

class EntryCache {
    var previousEntry: WalletWidgetEntry?
}

// Helium Wallet Widget Provider
struct Provider: IntentTimelineProvider {
    private let entryCache = EntryCache()
    func placeholder(in _: Context) -> WalletWidgetEntry {
        WalletWidgetEntry(date: Date(), configuration: ConfigurationIntent(), widgetData: Utils.mockAccountDetails())
    }

    func getSnapshot(for configuration: ConfigurationIntent, in _: Context, completion: @escaping (WalletWidgetEntry) -> Void) {
        let entry = WalletWidgetEntry(date: Date(), configuration: configuration, widgetData: Utils.mockAccountDetails())
        completion(entry)
    }

    func getTimeline(for configuration: ConfigurationIntent, in _: Context, completion: @escaping (Timeline<WalletWidgetEntry>) -> Void) {
        let userDefaults = UserDefaults(suiteName: "group.com.helium.mobile.wallet.widget")
        if userDefaults != nil {
            let entryDate = Date()
            if let savedData = userDefaults!.value(forKey: "heliumWalletWidgetKey") as? String {
                let decoder = JSONDecoder()
                let data = savedData.data(using: .utf8)

                // Decode widget data being injected via app groups. (https://github.com/KjellConnelly/react-native-shared-group-preferences)
                if let parsedData = try? decoder.decode(HeliumWalletWidgetData.self, from: data!) {
                    // Fetch data from nova-wallet-api
                  Network().getWidgetDataAndCharts(address: parsedData.defaultAccountAddress, cluster: parsedData.cluster, currency: parsedData.currencyType) { _, widgetData in
                        if let widgetData = widgetData {
                            // Refresh every 15 mins
                            let nextRefresh = Calendar.current.date(byAdding: .minute, value: 15, to: entryDate)!
                            let entry = WalletWidgetEntry(date: nextRefresh, configuration: configuration, widgetData: widgetData)
                            let timeline = Timeline(entries: [entry], policy: .atEnd)
                            entryCache.previousEntry = entry
                            completion(timeline)
                        }
                    }
                }
            } else {
                // If not found refresh in 5 mins
                let nextRefresh = Calendar.current.date(byAdding: .minute, value: 5, to: entryDate)!
                let entry = WalletWidgetEntry(date: nextRefresh, configuration: configuration, widgetData: Utils.emptyAccountDetails())
                let fallback = entryCache.previousEntry ?? entry
                let timeline = Timeline(entries: [fallback], policy: .atEnd)
                completion(timeline)
            }
        }
    }
}
