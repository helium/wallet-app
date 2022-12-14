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
    func fetchBalanceData(parsedWidgetData: HeliumWalletWidgetData, fallback: BalanceWidgetEntry, completion: @escaping (Error?, ParsedBalanceWidgetData?) -> Void) {
        let client = Network.shared.apollo

        client.fetch(query: WidgetDataQuery(address: parsedWidgetData.defaultAccountAddress, type: CurrencyType(rawValue: parsedWidgetData.currencyType) ?? CurrencyType.usd, minTime: "\(Utils.getDateStringFrom(-2, true))", midTime: "\(Utils.getDateStringFrom(-1, true))", maxTime: "\(Utils.getDateStringFrom(0, true))")) { result in
            switch result {
            case let .success(response):
                let parsedBalanceWidgetData = ParsedBalanceWidgetData(total: response.data?.currentRewards?.data.total ?? fallback.hntDailyEarnings, balance: response.data?.account?.balance ?? fallback.balance, price: response.data?.currentPrices?.hnt ?? fallback.hntPrice)
                completion(nil, parsedBalanceWidgetData)
            case let .failure(error):
                completion(error, nil)
            }
        }
    }

    /* Fetching data from nova-wallet-api. Leveraging apollo-ios to perform graphql
     * queries.
     */
    func fetchWalletData(parsedWidgetData: HeliumWalletWidgetData, fallback: DefaultAccountDetails, completion: @escaping (Error?, DefaultAccountDetails?) -> Void) {
        let client = Network.shared.apollo

        client.fetch(query: WidgetDataQuery(address: parsedWidgetData.defaultAccountAddress, type: CurrencyType(rawValue: parsedWidgetData.currencyType) ?? CurrencyType.usd, minTime: "\(Utils.getDateStringFrom(-2, true))", midTime: "\(Utils.getDateStringFrom(-1, true))", maxTime: "\(Utils.getDateStringFrom(0, true))")) { result in
            switch result {
            case let .success(response):

                if response.data == nil || response.data?.account?.balance == nil || response.data?.currentPrices?.hnt == nil {
                    completion(nil, fallback)
                }

                var chartValues: [Double] = []
                let history = response.data?.accountBalanceHistory ?? []

                let balanceHis = history.map { $0.balance }
                let maxBalance = balanceHis.max()
                let minBalance = balanceHis.min()

                // Calculate diff to use as divisor to get a number between 0 and 1 for Charts Package
                let diff = (maxBalance ?? 0.0) - (minBalance ?? 0.0)

                for (_, element) in history.enumerated() {
                    if diff != 0 {
                        chartValues.append((element.balance - minBalance!) / diff)
                    } else {
                        chartValues.append(0.5)
                    }
                }

                let hntAsset = HeliumAsset(name: "Helium", symbol: "HNT", balance: response.data?.account?.balance ?? 0, price: response.data?.currentPrices?.hnt ?? 0.0)
                let dcAsset = HeliumAsset(name: "Data Credits", symbol: "DC", balance: response.data?.account?.dcBalance ?? 0, price: 0.00001)
                let mobileAsset = HeliumAsset(name: "Mobile", symbol: "MOBILE", balance: response.data?.account?.mobileBalance ?? 0, price: 0)
                let accountDetails = DefaultAccountDetails(accountName: parsedWidgetData.defaultAccountAlias, accountAddress: parsedWidgetData.defaultAccountAddress, jazzSeed: parsedWidgetData.jazzSeed, isTestnet: parsedWidgetData.isTestnet, totalFiatBalance: Utils.calculateFiatBalance(assetPrice: response.data?.currentPrices?.hnt ?? 0.0, assetBalance: response.data?.account?.balance ?? 0), totalHNTBalance: response.data?.account?.balance ?? 0, assets: [hntAsset, mobileAsset, dcAsset], chartValues: chartValues)
                completion(nil, accountDetails)
            case let .failure(error):
                completion(error, nil)
            }
        }
    }
}
