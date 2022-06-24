//
//  HeliumWalletWidgetBundle.swift
//  HeliumWalletWidgetExtension
//
//  Created by Luis Perrone on 6/8/22.
//

import Intents
import SwiftUI
import WidgetKit

@main
struct HeliumWalletWidgetBundle: WidgetBundle {
    var body: some Widget {
        HeliumWalletWidget()
        HeliumBalanceWidget()
    }
}
