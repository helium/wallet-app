//
//  HeliumWalletWidgetSmallView.swift
//  HeliumWalletWidgetExtension
//
//  Created by Luis Perrone on 6/9/22.
//

import Intents
import SwiftUI
import WidgetKit

// Generating jazz image using seed number
func generateImage(jazzSeed: Int) -> UIImage {
    let image = Jazzicon(seed: UInt32(jazzSeed)).generateImage(size: 38)
    return image
}

// Wallet Small Widget View
struct HeliumWalletWidgetSmallView: View {
    var entry: Provider.Entry

    @ViewBuilder
    var body: some View {
      SmallWidgetContainer(widgetData: entry.widgetData.widgetData ?? Utils.emptyHNTBalanceWidgetDetails(), jazzIcon: generateImage(jazzSeed: 1))
    }
}

// ################ SMALL-WIDGET-VIEW ####################
