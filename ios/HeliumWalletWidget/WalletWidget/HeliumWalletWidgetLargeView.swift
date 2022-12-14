//
//  HeliumWalletWidgetLargeView.swift
//  HeliumWalletWidgetExtension
//
//  Created by Luis Perrone on 6/9/22.
//

import Charts
import Intents
import SwiftUI
import WidgetKit

// Finding suffix based on what type of asset.
func assetPriceConversion(_ symbol: String) -> String {
    switch symbol {
    case "HNT":
        return "USD"
    case "HST":
        return ""
    case "DC":
        return String(localized: "Wallet_Widget_Non_Transferable",
                      comment: "Helium wallet widget non transferable label.")
    case "MOBILE":
        return ""
    default:
        return "HNT"
    }
}

// Asset ListItem View for all coin types.
struct AssetListItemView: View {
    var imageName: String
    var assetBalance: String
    var symbolName: String
    var assetPrice: String
    var isTestnet: Bool

    @ViewBuilder
    var body: some View {
        let size = symbolName == "DC" ? 12.0 : 20.0
        HStack(spacing: 0) {
            imageName == "data-credits-logo" ? Spacer().frame(width: 20) : Spacer().frame(width: 16)
            Image(imageName).resizable().frame(width: size, height: size)
            Spacer().frame(width: 6)

            VStack(alignment: .leading) {
                Text("\(assetBalance) \(symbolName)")
                    .bold()
                    .font(.system(size: 12.0)).foregroundColor(.white).privacySensitive()
                HStack(spacing: 4) {
                    if assetPrice != "" && symbolName != "MOBILE" {
                        Text(assetPrice).lineLimit(1).font(.system(size: 10.0)).foregroundColor(.white).opacity(0.6)
                    }

                    if symbolName == "MOBILE" {
                        Text(String(localized: "Wallet_Widget_Mobile_Genesis",
                                    comment: "Helium wallet widget MOBILE Genesis label.")).lineLimit(1).font(.system(size: 10.0)).foregroundColor(.white).opacity(0.6)
                    }
                }
            }
            Spacer()
            Image("right-arrow").resizable().frame(width: 5, height: 10)
            Spacer().frame(width: 16)
        }.frame(width: .infinity, height: 40).background(.clear).clipShape(Rectangle())
    }
}

// Request button view
struct RequestButton: View {
    var body: some View {
        // Deep link into app
        Link(destination: URL(string: "heliumwallet://request")!) {
            HStack {
                Image("request-arrow").resizable().frame(width: 17, height: 20)
                Text(String(localized: "Wallet_Widget_Request",
                            comment: "Helium wallet widget request label.")).font(.system(size: 16.0)).foregroundColor(Color("malachite")).bold()
            }.clipShape(Rectangle()).frame(width: 132, height: 45).background(Color("RequestButtonColor")).cornerRadius(22.5)
        }
    }
}

// Send button view
struct SendButton: View {
    var body: some View {
        // Deep link into app
        Link(destination: URL(string: "heliumwallet://payment")!) {
            HStack {
                Text(String(localized: "Wallet_Widget_Send",
                            comment: "Helium wallet widget send label.")).font(.system(size: 16.0)).foregroundColor(Color("azure-radiance")).bold()
                Image("send-arrow").resizable().frame(width: 17, height: 20)
            }.clipShape(Rectangle()).frame(width: 132, height: 45).background(Color("SendButtonColor")).cornerRadius(22.5)
        }
    }
}

private struct CompositeChartDemo: View {
    @State var data4: [CGFloat] = (0 ..< 100).map { _ in .random(in: 0.4 ... 1.0) }
    @State var data5: [CGFloat] = (0 ..< 100).map { _ in .random(in: 0.1 ... 0.3) }
    @State var data6: [CGFloat] = (0 ..< 100).map { _ in .random(in: 0.3 ... 0.4) }

    var body: some View {
        ZStack {
            Chart(data: data4)
                .chartStyle(
                    LineChartStyle(.quadCurve, lineColor: .purple, lineWidth: 3)
                )

            Chart(data: data4)
                .chartStyle(
                    AreaChartStyle(.quadCurve, fill:
                        LinearGradient(gradient: .init(colors: [Color.purple.opacity(0.8), Color.purple.opacity(0.2)]), startPoint: .top, endPoint: .bottom))
                )

            Chart(data: data5)
                .chartStyle(
                    ColumnChartStyle(column: Color.white.opacity(0.5), spacing: 2)
                )

            Chart(data: data6)
                .chartStyle(
                    LineChartStyle(.line, lineColor: Color.white.opacity(0.2), lineWidth: 3)
                )
        }
        .padding()
        .background(Color.gray.opacity(0.1))
        .cornerRadius(16)
        .padding()
    }
}

/**
 * Get fiat amount from current asset balance
 */
func getCurrentAssetPrice(_ asset: HeliumAsset) -> Double {
    if asset.symbol == "DC" {
        return Double(asset.balance) * asset.price
    } else {
        return asset.balance.fromBones * asset.price
    }
}

// Wallet Large Widget View
struct HeliumWalletWidgetLargeView: View {
    var entry: Provider.Entry

    @ViewBuilder
    var body: some View {
        let assets = entry.accountDetails.assets
        let data = entry.accountDetails.chartValues.count > 1 ? entry.accountDetails.chartValues : [1.0, 1.0]

        VStack {
            VStack(alignment: .center, spacing: 4) {
                Spacer().frame(height: 16.0)

                HStack(spacing: 4) {
                    if entry.accountDetails.isTestnet { Image("testnet-balance-logo").resizable().frame(width: 9, height: 10)
                    }
                    Text(String(localized: !entry.accountDetails.isTestnet ? "Wallet_Widget_Balance" : "TESTNET_Wallet_Widget_Balance",
                                comment: "Helium wallet widget balance label."))
                        .font(.system(size: 12.0)).foregroundColor(.white).opacity(0.6)
                }

                Text("$\(entry.accountDetails.totalFiatBalance.kmFormatted)").bold().lineLimit(1)
                    .font(.system(size: 28.0)).foregroundColor(.white).privacySensitive()

                Text("\(entry.accountDetails.totalHNTBalance.fromBones.kmFormatted) \(Utils.networkTokenLabel(isTestnet: entry.accountDetails.isTestnet))")
                    .lineLimit(1).font(.system(size: 12.0)).foregroundColor(.white).opacity(0.6).privacySensitive()

                Spacer()
                HStack(alignment: .center) {
                    Spacer()
                    RequestButton()
                    SendButton()
                    Spacer()
                }
                Spacer()

                Spacer().frame(height: 4.0)

                ZStack {
                    Chart(data: data)
                        .chartStyle(
                            LineChartStyle(data.count > 2 ? .quadCurve : .line, lineColor: Color("LineColor"), lineWidth: 1)
                        )

                    Chart(data: data)
                        .chartStyle(
                            AreaChartStyle(data.count > 2 ? .quadCurve : .line, fill:
                                LinearGradient(gradient: .init(colors: [Color.white.opacity(0.2), Color.white.opacity(0.01)]), startPoint: .top, endPoint: .bottom))
                        )
                }.padding(.leading, 16).padding(.trailing, 16)

                VStack(spacing: 0) {
                    Divider().padding(.leading, 16).padding(.trailing, 16)
                    ForEach(0 ..< 2, id: \.self) { i in
                        AssetListItemView(imageName: Utils.getCoinImageName(assets[i].symbol), assetBalance: Utils.getCurrentBalance(asset: assets[i]), symbolName: assets[i].symbol, assetPrice: "$\(String(format: "%.2f", getCurrentAssetPrice(assets[i]))) \(assetPriceConversion(assets[i].symbol))", isTestnet: entry.accountDetails.isTestnet).padding(.leading, 4).padding(.trailing, 4)
                    }
                    Spacer().frame(height: 8.0)
                }

            }.padding(0.0)
        }.background(Color("WidgetBackground"))
    }
}
