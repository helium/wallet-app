//
//  HeliumAccessoryCirclularView.swift
//  HeliumWalletWidgetExtension
//
//  Created by Luis Perrone on 8/7/22.
//

import Foundation
import SwiftUI

// Circular Assetview for HNT
struct AssetViewCircular: View {
    var imageName: String
    var assetPrice: String

    @ViewBuilder
    var body: some View {
        let size = 20.0

        VStack(spacing: 0) {
            VStack(spacing: 0) {
                Image(imageName).resizable()
                    .frame(width: size, height: size)
            }.frame(width: 20, height: 20).background(.clear).clipShape(Circle())
            Spacer().frame(height: 4)
            Text(assetPrice)
                .bold().lineLimit(1)
                .font(.system(size: 10.0)).foregroundColor(.white)
        }
    }
}

struct HeliumTickerAccessoryCirclularView: View {
    var entry: HNTBalanceWidgetProvider.Entry

    @ViewBuilder
    var body: some View {
        VStack(spacing: 0) {
            Spacer()
            CustomView(content: {
              AssetViewCircular(imageName: Utils.getCoinImageName("HNT"), assetPrice: "$\(String(format: "%.2f", entry.widgetData.heliumPrice))")
            }).frame(minWidth: 0, maxWidth: .infinity, minHeight: 0, maxHeight: .infinity)
            Spacer()
        }.aspectRatio(1.0, contentMode: .fit).background(.black)
    }
}
