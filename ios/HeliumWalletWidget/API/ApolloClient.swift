//
//  ApolloClient.swift
//  HeliumWallet
//
//  Created by Luis Perrone on 6/10/22.
//

import Apollo
import Foundation

class Network {
    static let shared = Network()
    // Fallback in case url from ReactNativeConfig fails
    var prodUrl = "https:/wallet-api.helium.com/api/graphiql"
    var url = ReactNativeConfig.env(for: "GRAPH_URI")
    private(set) lazy var apollo = ApolloClient(url: URL(string: url ?? prodUrl)!)

    /* Helium Balance Widget Fetch
     * Fetching data from nova-wallet-api. Leveraging apollo-ios to perform graphql
     * queries.
     */
    func fetchBalanceData(parsedWidgetData: HeliumWalletWidgetData, completion: @escaping (Error?, ParsedBalanceWidgetData?) -> Void) {
        let client = Network.shared.apollo

        client.fetch(query: WidgetDataQuery(address: parsedWidgetData.defaultAccountAddress, minTime: "\(Utils.getDateStringFrom(-2, true))", midTime: "\(Utils.getDateStringFrom(-1, true))", maxTime: "\(Utils.getDateStringFrom(0, true))")) { result in
            switch result {
            case let .success(response):
                let parsedBalanceWidgetData = ParsedBalanceWidgetData(total: response.data?.currentRewards?.data.total ?? 0.0, balance: response.data?.account?.balance ?? 0, price: response.data?.pricing?.hnt.usd ?? 0.0)
                completion(nil, parsedBalanceWidgetData)
            case let .failure(error):
                completion(error, nil)
            }
        }
    }

    /* Fetching data from nova-wallet-api. Leveraging apollo-ios to perform graphql
     * queries.
     */
    func fetchWalletData(parsedWidgetData: HeliumWalletWidgetData, completion: @escaping (Error?, DefaultAccountDetails?) -> Void) {
        let client = Network.shared.apollo

        client.fetch(query: WidgetDataQuery(address: parsedWidgetData.defaultAccountAddress, minTime: "\(Utils.getDateStringFrom(-2, true))", midTime: "\(Utils.getDateStringFrom(-1, true))", maxTime: "\(Utils.getDateStringFrom(0, true))")) { result in
            switch result {
            case let .success(response):
                let lastWeekBalance = response.data?.prevRewards?.data.total
                let currentWeekBalance = response.data?.currentRewards?.data.total

                var percentChange = 0.0

                if currentWeekBalance == 0, lastWeekBalance == 0 {
                    percentChange = 0.0
                } else if currentWeekBalance != nil, lastWeekBalance != nil {
                    percentChange = (currentWeekBalance! - lastWeekBalance!) / currentWeekBalance! * 100
                } else if currentWeekBalance != nil {
                    percentChange = currentWeekBalance! * 100.0
                } else if lastWeekBalance != nil {
                    percentChange = lastWeekBalance! * 100.0
                }

                let percentChangeString = percentChange > 0.0 ? "+\(String(format: "%.2f", percentChange))%" : "\(String(format: "%.2f", percentChange))%"

                let hntAsset = HeliumAsset(name: "Helium", symbol: "HNT", balance: response.data?.account?.balance ?? 0, price: response.data?.pricing?.hnt.usd ?? 0.0, percentChange: percentChangeString)
                let dcAsset = HeliumAsset(name: "Data Credits", symbol: "DC", balance: response.data?.account?.dcBalance ?? 0, price: 0.00001, percentChange: "0")
                let accountDetails = DefaultAccountDetails(accountName: parsedWidgetData.defaultAccountAlias, accountAddress: parsedWidgetData.defaultAccountAddress, jazzSeed: parsedWidgetData.jazzSeed, isTestnet: parsedWidgetData.isTestnet, totalFiatBalance: Utils.calculateFiatBalance(assetPrice: response.data?.pricing?.hnt.usd ?? 0.0, assetBalance: response.data?.account?.balance ?? 0), totalHNTBalance: response.data?.account?.balance ?? 0, totalPercentChange: percentChangeString, assets: [hntAsset, dcAsset])
                completion(nil, accountDetails)
            case let .failure(error):
                completion(error, nil)
            }
        }
    }
}
