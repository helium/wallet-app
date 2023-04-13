//
//  HeliumAccessoryCirclularView.swift
//  HeliumWalletWidgetExtension
//
//  Created by Luis Perrone on 8/7/22.
//

import Foundation
import SwiftUI

// Corner Assetview for HNT
struct AssetViewCorner: View {
    var assetPrice: String

    @ViewBuilder
    var body: some View {
        HStack(spacing: 4) {
            Text("HNT")
                .bold().lineLimit(1)
                .font(.system(size: 10.0)).foregroundColor(.white)
            Text(assetPrice)
                .bold().lineLimit(1)
                .font(.system(size: 10.0)).foregroundColor(.white)
        }
    }
}

struct HeliumTickerAccessoryCornerView: View {
    var entry: HNTBalanceWidgetProvider.Entry

    @ViewBuilder
    var body: some View {
        HStack(spacing: 0) {
            Spacer()
          AssetViewCorner(assetPrice: "$\(String(format: "%.2f", entry.widgetData.heliumPrice))")
            Spacer()
        }.aspectRatio(1.0, contentMode: .fill).background(.clear)
    }
}
