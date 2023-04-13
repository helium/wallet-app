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


// Wallet Large Widget View
struct HeliumWalletWidgetLargeView: View {
    var entry: Provider.Entry

    @ViewBuilder
    var body: some View {
        let widgetData = entry.widgetData.widgetData
      
      let data =  entry.widgetData.chartData != nil && entry.widgetData.chartData!.count > 1  ? Utils.convertBalanceHistoryToChartData(history: entry.widgetData.chartData ?? []) : [1.0, 1.0]

        VStack {
            VStack(alignment: .center, spacing: 4) {
                Spacer().frame(height: 16.0)

              HStack(spacing: 4) {
                    Text(String(localized: "Wallet_Widget_Balance",
                                comment: "Helium wallet widget balance label."))
                        .font(.system(size: 12.0)).foregroundColor(.white).opacity(0.6)
                }

              Text("$\(String(format: "%.2f", Utils.calculateFiatBalance(assetPrice: widgetData!.heliumPrice, assetBalance: widgetData!.hntBalance)))").bold().lineLimit(1)
                    .font(.system(size: 28.0)).foregroundColor(.white).privacySensitive()

              Text(widgetData!.hntBalance.kmFormatted)
                    .lineLimit(1).font(.system(size: 12.0)).foregroundColor(.white).opacity(0.6).privacySensitive()

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
                  AssetListItemView(imageName: Utils.getCoinImageName("HNT"), assetBalance: widgetData!.hntBalance.kmFormatted, symbolName: "HNT", assetPrice: "$\(String(format: "%.2f", widgetData!.heliumPrice))").padding(.leading, 4).padding(.trailing, 4)
                  AssetListItemView(imageName: Utils.getCoinImageName("MOBILE"), assetBalance: widgetData!.mobileBalance.kmFormatted, symbolName: "MOBILE", assetPrice: "In Genesis").padding(.leading, 4).padding(.trailing, 4)
                  AssetListItemView(imageName: Utils.getCoinImageName("IOT"), assetBalance: widgetData!.iotBalance.kmFormatted, symbolName: "IOT", assetPrice: "In Genesis").padding(.leading, 4).padding(.trailing, 4)
                    Spacer().frame(height: 8.0)
                }

            }.padding(0.0)
        }.background(Color("WidgetBackground"))
    }
}
