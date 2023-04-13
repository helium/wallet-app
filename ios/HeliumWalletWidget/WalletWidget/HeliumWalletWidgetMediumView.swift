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
        }.frame(height: 25).background(Color("surfaceColor")).clipShape(Rectangle()).cornerRadius(12.5)
    }
}

// Wallet Medium Widget View
struct HeliumWalletWidgetMediumView: View {
    var entry: Provider.Entry
    @ViewBuilder
    var body: some View {
      let widgetData = entry.widgetData.widgetData
      let data =  entry.widgetData.chartData != nil && entry.widgetData.chartData!.count > 1  ? Utils.convertBalanceHistoryToChartData(history: entry.widgetData.chartData ?? []) : [1.0, 1.0]

        HStack {
            VStack {
                VStack(alignment: .leading, spacing: 0) {
                    Spacer().frame(height: 4)

                    HStack {
                        VStack(alignment: .leading, spacing: 0) {
                            HStack(spacing: 4) {
                                Spacer().frame(width: 8)
                                Text(String(localized:  "Wallet_Widget_Balance",
                                            comment: "Helium wallet widget balance label."))
                                    .font(.system(size: 12.0)).foregroundColor(.white).opacity(0.6)
                                Spacer()
                            }
                            Spacer().frame(height: 4)
                            HStack {
                                Spacer().frame(width: 8)
                              Text("$\(String(format: "%.2f", (Utils.calculateFiatBalance(assetPrice: widgetData!.heliumPrice, assetBalance: widgetData!.hntBalance))))").bold()
                                    .font(.system(size: 24.0)).foregroundColor(.white).privacySensitive()

                                VStack {
                                    Spacer().frame(height: 8)
                                  Text("\(widgetData!.hntBalance.kmFormatted) HNT")
                                        .lineLimit(1).font(.system(size: 12.0)).foregroundColor(.white).opacity(0.6).privacySensitive()
                                }

                                Spacer()
                            }
                        }
  
                    }
                    Spacer()
                }
              HStack(spacing: 4) {
                AssetPillView(imageName: Utils.getCoinImageName("HNT"), assetBalance: widgetData!.hntBalance.kmFormatted)
                AssetPillView(imageName: Utils.getCoinImageName("MOBILE"), assetBalance: widgetData!.mobileBalance.kmFormatted)
                AssetPillView(imageName: Utils.getCoinImageName("IOT"), assetBalance: widgetData!.iotBalance.kmFormatted)
                Spacer()
              }.padding(.top, 0).padding(.trailing, 0)
                Spacer().frame(height: 6)

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
                }
            }.padding(12.0)
        }.background(Color("WidgetBackground"))
    }
}
