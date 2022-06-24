//
//  HeliumWalletWidgetMediumView.swift
//  HeliumWalletWidgetExtension
//
//  Created by Luis Perrone on 6/9/22.
//

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
                .font(.system(size: 10.0)).foregroundColor(.white)
            Spacer().frame(width: 6)
        }.frame(height: 25).background(Color(Utils.getSurfaceColorName(isTestnet: isTestnet))).clipShape(Rectangle()).cornerRadius(12.5)
    }
}

// Wallet Medium Widget View
struct HeliumWalletWidgetMediumView: View {
    var entry: Provider.Entry

    @ViewBuilder
    var body: some View {
        let assets = entry.accountDetails.assets

        VStack {
            VStack(alignment: .leading, spacing: 0) {
                Rectangle().frame(height: 8.0).foregroundColor(.clear)
                HStack {
                    HStack {
                        HStack {
                            VStack(spacing: 0) {
                                Image(uiImage: generateImage(jazzSeed: entry.accountDetails.jazzSeed)).resizable()
                                    .frame(width: 38, height: 38)
                            }.frame(width: 38, height: 38).clipShape(Circle())
                            VStack(alignment: .leading) {
                                Text("\(Utils.renderConstructionEmoji(isTestnet: entry.accountDetails.isTestnet)) \(entry.accountDetails.accountName)")
                                    .bold().lineLimit(1)
                                    .font(.system(size: 12.0)).foregroundColor(.white)
                            }
                        }

                        Spacer()

                        VStack {
                            Text(entry.accountDetails.totalPercentChange)
                                .bold()
                                .font(.system(size: 12.0)).foregroundColor(Color(red: 20 / 255, green: 209 / 255, blue: 17 / 255))
                            Text(String(localized: "Wallet_Widget_Last_24h",
                                        comment: "Helium wallet widget last 24hr label."))
                                .bold()
                                .font(.system(size: 10.0)).foregroundColor(.white).opacity(0.6)
                        }
                    }.padding(8.0)
                }.clipShape(Rectangle()).background(Color(Utils.getSurfaceColorName(isTestnet: entry.accountDetails.isTestnet))).cornerRadius(8.0)

                Spacer().frame(height: 4)

                HStack {
                    VStack(alignment: .leading, spacing: 0) {
                        HStack(spacing: 4) {
                            if entry.accountDetails.isTestnet { Image("testnet-balance-logo").resizable().frame(width: 9, height: 10)
                            }
                            Text(String(localized: !entry.accountDetails.isTestnet ? "Wallet_Widget_Balance" : "TESTNET_Wallet_Widget_Balance",
                                        comment: "Helium wallet widget balance label."))
                                .font(.system(size: 12.0)).foregroundColor(.white).opacity(0.6)
                            Spacer()
                        }
                        Spacer().frame(height: 4)
                        HStack {
                            Text("$\(entry.accountDetails.totalFiatBalance.kmFormatted)").bold()
                                .font(.system(size: 24.0)).foregroundColor(.white)

                            Spacer()
                            Text("\(entry.accountDetails.totalHNTBalance.fromBones.kmFormatted) \(Utils.networkTokenLabel(isTestnet: entry.accountDetails.isTestnet))")
                                .lineLimit(1).font(.system(size: 12.0)).foregroundColor(.white).opacity(0.6)
                        }
                    }
                }

                Spacer().frame(height: 6)

                HStack(spacing: 8) {
                    ForEach(0 ..< assets.count, id: \.self) { i in
                        AssetPillView(imageName: Utils.getCoinImageName(assets[i].symbol), assetBalance: Utils.getCurrentBalance(asset: assets[i]), isTestnet: entry.accountDetails.isTestnet)
                    }
                    Spacer()
                }
                Spacer()
            }.padding(12.0)
        }.background(Color("WidgetBackground"))
    }
}
