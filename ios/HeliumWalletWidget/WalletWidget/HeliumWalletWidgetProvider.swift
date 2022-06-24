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
    let jazzSeed: Int
    let defaultAccountAlias: String
    let isTestnet: Bool
}

// Struct for each asset held by account.
struct HeliumAsset {
    let name: String
    let symbol: String
    let balance: Int
    let price: Double
    let percentChange: String
}

// Default Account details including all held assets.
struct DefaultAccountDetails {
    let accountName: String
    let accountAddress: String
    let jazzSeed: Int
    let isTestnet: Bool
    let totalFiatBalance: Double
    let totalHNTBalance: Int
    let totalPercentChange: String
    let assets: [HeliumAsset]
}

// WidgetEntry extending from TimelineEntry in order to refresh based on date.
struct WalletWidgetEntry: TimelineEntry {
    var date: Date
    var configuration: ConfigurationIntent
    var accountDetails: DefaultAccountDetails
}

// Helium Wallet Widget Provider
struct Provider: IntentTimelineProvider {
    func placeholder(in _: Context) -> WalletWidgetEntry {
        WalletWidgetEntry(date: Date(), configuration: ConfigurationIntent(), accountDetails: Utils.mockAccountDetails())
    }

    func getSnapshot(for configuration: ConfigurationIntent, in _: Context, completion: @escaping (WalletWidgetEntry) -> Void) {
        let entry = WalletWidgetEntry(date: Date(), configuration: configuration, accountDetails: Utils.mockAccountDetails())
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
                    Network().fetchWalletData(parsedWidgetData: parsedData) { _, defaultAccountDetails in
                        if let defaultAccountDetails = defaultAccountDetails {
                            // Refresh every 15 mins
                            let nextRefresh = Calendar.current.date(byAdding: .minute, value: 15, to: entryDate)!
                            let entry = WalletWidgetEntry(date: nextRefresh, configuration: configuration, accountDetails: defaultAccountDetails)
                            let timeline = Timeline(entries: [entry], policy: .atEnd)
                            completion(timeline)
                        }
                    }
                }
            } else {
                // If not found refresh in 5 mins
                let nextRefresh = Calendar.current.date(byAdding: .minute, value: 5, to: entryDate)!
                let entry = WalletWidgetEntry(date: nextRefresh, configuration: configuration, accountDetails: Utils.emptyAccountDetails())
                let timeline = Timeline(entries: [entry], policy: .atEnd)
                completion(timeline)
            }
        }
    }
}
