//
//  HeliumAccessoryCirclularView.swift
//  HeliumWalletWidgetExtension
//
//  Created by Luis Perrone on 8/7/22.
//

import Foundation
import SwiftUI

// Rectangular Assetview for HNT
struct AssetViewRectangular: View {
    var imageName: String
    var assetPrice: String

    @ViewBuilder
    var body: some View {
        let size = 18.0

        HStack(spacing: 0) {
            VStack(spacing: 0) {
                Image(imageName).resizable()
                    .frame(width: size, height: size)
            }.frame(width: 18, height: 18).background(.clear).clipShape(Circle())
            Spacer()
            VStack(alignment: .trailing) {
                Text("Helium (HNT)").bold().lineLimit(1).font(.system(size: 12.0))
                Text(assetPrice).bold().lineLimit(1)
                    .font(.system(size: 12.0))
            }
        }
    }
}

struct MyWalletRectangularView: View {
    var balance: String

    @ViewBuilder
    var body: some View {
        HStack(spacing: 0) {
            Text(String(localized: "Balance",
                        comment: "Helium Balance widget rectangular accessory view balance label.")).bold().lineLimit(1).font(.system(size: 12.0))
            Spacer()
            VStack(alignment: .trailing) {
                Text(balance).bold().lineLimit(1)
                    .font(.system(size: 12.0))
            }.privacySensitive()
        }
    }
}

struct HeliumTickerAccessoryRectangularView: View {
    var entry: HNTBalanceWidgetProvider.Entry

    @ViewBuilder
    var body: some View {
        if #available(iOSApplicationExtension 16.0, *) {
            VStack(spacing: 4) {
              AssetViewRectangular(imageName: Utils.getCoinImageName("HNT"), assetPrice: "$\(String(format: "%.2f", entry.widgetData.heliumPrice))")
                Spacer().frame(height: 4)
              MyWalletRectangularView(balance: entry.widgetData.hntBalance.kmFormatted)
            }.padding(4.0).aspectRatio(1.0, contentMode: .fill).background(.clear).cornerRadius(4.0)
        } else {
            // Fallback on earlier versions
            VStack(spacing: 4) {
              AssetViewRectangular(imageName: Utils.getCoinImageName("HNT"), assetPrice: "$\(String(format: "%.2f", entry.widgetData.heliumPrice))")
                Spacer().frame(height: 4)
              MyWalletRectangularView(balance: entry.widgetData.hntBalance.kmFormatted)
            }.padding(4.0).aspectRatio(1.0, contentMode: .fill).background(.clear).cornerRadius(4.0)
        }
    }
}
