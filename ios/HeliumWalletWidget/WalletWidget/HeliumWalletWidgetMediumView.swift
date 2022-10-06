//
//  HeliumWalletWidgetMediumView.swift
//  HeliumWalletWidgetExtension
//
//  Created by Luis Perrone on 6/9/22.
//

import Charts
import Intents
import SwiftUI
import WidgetKit

// Asset pill view for all different coins
struct AssetPillView: View {
    var imageName: String
    var assetBalance: String
    var isTestnet: Bool

    var body: some View {
        let size = imageName == "data-credits-logo" ? 12.0 : 16.0

        HStack(spacing: 0) {
            Spacer().frame(width: 6)
            Image(imageName).resizable().frame(width: size, height: size)
            Spacer().frame(width: 6)
            Text(assetBalance)
                .bold()
                .font(.system(size: 10.0)).foregroundColor(.white).privacySensitive()
            Spacer().frame(width: 6)
        }.frame(height: 25).background(.clear).clipShape(Rectangle()).cornerRadius(12.5)
    }
}

// Wallet Medium Widget View
struct HeliumWalletWidgetMediumView: View {
    var entry: Provider.Entry
    @ViewBuilder
    var body: some View {
        let assets = entry.accountDetails.assets
        let data = entry.accountDetails.chartValues.count > 1 ? entry.accountDetails.chartValues : [1.0, 1.0]

        HStack {
            VStack {
                VStack(alignment: .leading, spacing: 0) {
                    Spacer().frame(height: 4)

                    HStack {
                        VStack(alignment: .leading, spacing: 0) {
                            HStack(spacing: 4) {
                                Spacer().frame(width: 8)
                                if entry.accountDetails.isTestnet { Image("testnet-balance-logo").resizable().frame(width: 9, height: 10)
                                }
                                Text(String(localized: !entry.accountDetails.isTestnet ? "Wallet_Widget_Balance" : "TESTNET_Wallet_Widget_Balance",
                                            comment: "Helium wallet widget balance label."))
                                    .font(.system(size: 12.0)).foregroundColor(.white).opacity(0.6)
                                Spacer()
                            }
                            Spacer().frame(height: 4)
                            HStack {
                                Spacer().frame(width: 8)
                                Text("$\(entry.accountDetails.totalFiatBalance.kmFormatted)").bold()
                                    .font(.system(size: 24.0)).foregroundColor(.white).privacySensitive()

                                VStack {
                                    Spacer().frame(height: 8)
                                    Text("\(entry.accountDetails.totalHNTBalance.fromBones.kmFormatted) \(Utils.networkTokenLabel(isTestnet: entry.accountDetails.isTestnet))")
                                        .lineLimit(1).font(.system(size: 12.0)).foregroundColor(.white).opacity(0.6).privacySensitive()
                                }

                                Spacer()
                            }
                        }
                        VStack(alignment: .leading, spacing: 4) {
                            ForEach(0 ..< 2, id: \.self) { i in
                                AssetPillView(imageName: Utils.getCoinImageName(assets[i].symbol), assetBalance: Utils.getCurrentBalance(asset: assets[i]), isTestnet: entry.accountDetails.isTestnet)
                            }
                        }.padding(.top, 0).padding(.trailing, 0)
                    }
                    Spacer()
                }

                Spacer().frame(height: 6)

                ZStack {
                    Chart(data: data)
                        .chartStyle(
                            LineChartStyle(.line, lineColor: Color("LineColor"), lineWidth: 1)
                        )

                    Chart(data: data)
                        .chartStyle(
                            AreaChartStyle(.line, fill:
                                LinearGradient(gradient: .init(colors: [Color.white.opacity(0.2), Color.white.opacity(0.01)]), startPoint: .top, endPoint: .bottom))
                        )
                }
            }.padding(12.0)
        }.background(Color("WidgetBackground"))
    }
}
