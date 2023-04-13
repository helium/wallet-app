//
//  SharedWidgetViews.swift
//  HeliumWallet
//
//  Created by Luis Perrone on 6/17/22.
//

import Foundation
import SwiftUI

// Custom view to wrap and slot content
struct CustomView<Content: View>: View {
    var content: () -> Content

    init(@ViewBuilder content: @escaping () -> Content) { self.content = content }

    var body: some View {
        content() // <<: Do anything you want with your imported View here.
    }
}

// Getting image size based on asset
func getImageSize(_ imageName: String) -> Double {
    if imageName == "data-credits-logo" {
        return 16.0
    } else if imageName == "profile-img" {
        return 38.0
    } else {
        return 25.0
    }
}

// Account Image view
struct AccountImageView: View {
    var accountName: String
    var jazzIcon: UIImage

    @ViewBuilder
    var body: some View {
        let size = 38.0

        VStack {
            VStack(spacing: 0) {
                Image(uiImage: jazzIcon).resizable()
                    .frame(width: size, height: size)
            }.frame(width: 38, height: 38).background(Color(red: 33 / 255, green: 33 / 255, blue: 33 / 255)).clipShape(Circle())
            Text(accountName)
                .bold().lineLimit(1)
                .font(.system(size: 10.0)).foregroundColor(.white)
        }
    }
}

// Circular Assetview for all different coins
struct AssetView: View {
    var imageName: String
    var assetBalance: String?
    var title: String?

    @ViewBuilder
    var body: some View {
        let isAsset = title == nil ? true : false
        let size = getImageSize(imageName)
        let text = isAsset ? assetBalance! : title!

        VStack {
            VStack(spacing: 0) {
                Image(imageName).resizable()
                    .frame(width: size, height: size)
            }.frame(width: 40, height: 40).background(Color(red: 33 / 255, green: 33 / 255, blue: 33 / 255)).clipShape(Circle())
            Text(text)

                .bold().lineLimit(1)
                .font(.system(size: 10.0)).foregroundColor(.white)
        }
    }
}

struct SmallWidgetContainer: View {
    var widgetData: WidgetData
    var jazzIcon: UIImage

    @ViewBuilder
    var body: some View {

        VStack(spacing: 0) {
            Spacer()
            HStack {
                Spacer()
                CustomView(content: {
                  AssetView(imageName: Utils.getCoinImageName("HNT"), assetBalance: widgetData.hntBalance.kmFormatted)
                }).frame(minWidth: 0, maxWidth: .infinity, minHeight: 0, maxHeight: .infinity)
                Spacer()
                CustomView(content: {
                  AssetView(imageName: Utils.getCoinImageName("MOBILE"), assetBalance:  widgetData.mobileBalance.kmFormatted)
                }).frame(minWidth: 0, maxWidth: .infinity, minHeight: 0, maxHeight: .infinity)
                Spacer()
            }
            HStack {
                Spacer()
                CustomView(content: {
                  AssetView(imageName: Utils.getCoinImageName("IOT"), assetBalance: widgetData.iotBalance.kmFormatted)
                }).frame(minWidth: 0, maxWidth: .infinity, minHeight: 0, maxHeight: .infinity)
                Spacer()
                CustomView(content: {
                  AssetView(imageName: Utils.getCoinImageName("SOL"), assetBalance: widgetData.solBalance.kmFormatted)
                }).frame(minWidth: 0, maxWidth: .infinity, minHeight: 0, maxHeight: .infinity)
                Spacer()
            }
            Spacer()
        }.aspectRatio(1.0, contentMode: .fit).background(Color(red: 19 / 255, green: 20 / 255, blue: 25 / 255))
    }
}
