//
//  WidgetKitHelper.swift
//  HeliumWallet
//
//  Created by Luis Perrone on 6/21/22.
//

import WidgetKit

@available(iOS 14.0, *)
@objcMembers final class WidgetKitHelper: NSObject {
    class func reloadAllWidgets() {
        #if arch(arm64) || arch(i386) || arch(x86_64)
            WidgetCenter.shared.reloadAllTimelines()
        #endif
    }
}
