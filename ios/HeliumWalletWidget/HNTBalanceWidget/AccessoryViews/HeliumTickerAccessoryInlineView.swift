//
//  HeliumAccessoryCirclularView.swift
//  HeliumWalletWidgetExtension
//
//  Created by Luis Perrone on 8/7/22.
//

import Foundation
import SwiftUI

// Inline Assetview for HNT
struct AssetViewInline: View {
    var imageName: String
    var assetPrice: String

    @ViewBuilder
    var body: some View {
        let size = 18.0
        HStack(spacing: 4) {
            VStack(spacing: 0) {
                Image(imageName).resizable()
                    .frame(width: size, height: size)
            }.frame(width: size, height: size).background(.clear).clipShape(Circle())
            Text("HNT \(assetPrice)")
                .bold()
                .font(.title).minimumScaleFactor(0.1).foregroundColor(.black)
        }
    }
}

@available(iOSApplicationExtension 16.0, *)
struct HeliumTickerAccessoryInlineView: View {
    var entry: HNTBalanceWidgetProvider.Entry

    @ViewBuilder
    var body: some View {
        ViewThatFits {
            CustomView(content: {
              AssetViewInline(imageName: Utils.getCoinImageName("HNT"), assetPrice: "$\(String(format: "%.2f", entry.widgetData.heliumPrice))")
            })
        }.frame(minWidth: 0, maxWidth: .infinity, minHeight: 0, maxHeight: .infinity).background(.clear)
    }
}
