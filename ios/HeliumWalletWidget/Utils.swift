//
//  Utils.swift
//  HeliumWalletWidgetExtension
//
//  Created by Luis Perrone on 6/8/22.
//

import Apollo
import Foundation

extension Double {
    var kmFormatted: String {
        if self >= 10000, self <= 999_999 {
            return String(format: "%.2fK", locale: Locale.current, self / 1000).replacingOccurrences(of: ".00", with: "")
        }

        if self > 999_999, self <= 999_999_999 {
            return String(format: "%.2fM", locale: Locale.current, self / 1_000_000).replacingOccurrences(of: ".00", with: "")
        }

        if self > 999_999_999 {
            return String(format: "%.2fB", locale: Locale.current, self / 1_000_000_000).replacingOccurrences(of: ".00", with: "")
        }

        return String(format: "%.2f", locale: Locale.current, self)
    }
}

extension Int {
    var fromBones: Double {
        return (Double(self) / 100_000_000)
    }

    var kmFormatted: String {
        if self >= 10000, self <= 999_999 {
            return String(format: "%.2fK", locale: Locale.current, Double(self) / Double(1000)).replacingOccurrences(of: ".00", with: "")
        }

        if self > 999_999, self <= 999_999_999 {
            return String(format: "%.2fM", locale: Locale.current, Double(self) / Double(1_000_000)).replacingOccurrences(of: ".00", with: "")
        }

        if self > 999_999_999 {
            return String(format: "%.2fB", locale: Locale.current, Double(self) / Double(1_000_000_000)).replacingOccurrences(of: ".00", with: "")
        }

        return String(self)
    }
}

enum Utils {
    static func networkTokenLabel(isTestnet: Bool) -> String {
        return isTestnet ? "TNT" : "HNT"
    }

    static func getSurfaceColorName(isTestnet: Bool) -> String {
        return isTestnet ? "TestnetColor" : "surfaceColor"
    }

    static func renderConstructionEmoji(isTestnet: Bool) -> String {
        return isTestnet ? "🚧" : ""
    }

    // Mock account details.
    static func mockAccountDetails() -> DefaultAccountDetails {
        let assets: [HeliumAsset] = [HeliumAsset(name: "Helium", symbol: "HNT", balance: 9_504_123_000_000_000, price: 11.72), HeliumAsset(name: "Mobile", symbol: "MOBILE", balance: 119_992_453_143_221, price: 1.00), HeliumAsset(name: "Data Credits", symbol: "DC", balance: 33850, price: 0.00001)]

        let accountDetails = DefaultAccountDetails(accountName: "Satoshi", accountAddress: "13M8dUbxymE3xtiAXszRkGMmezMhBS8Li7wEsMojLdb4Sdxc4wc", jazzSeed: 71, isTestnet: false, totalFiatBalance: 96231.52, totalHNTBalance: 1_969_009_293_847_000_000, assets: assets, chartValues: [])
        return accountDetails
    }

    // Empty account details for when Network issues occur
    static func emptyAccountDetails() -> DefaultAccountDetails {
        let assets: [HeliumAsset] = []
        let accountDetails = DefaultAccountDetails(accountName: "", accountAddress: "", jazzSeed: 0, isTestnet: false, totalFiatBalance: 0, totalHNTBalance: 0, assets: assets, chartValues: [0, 1.0])
        return accountDetails
    }

    static func emptyHNTBalanceWidgetDetails() -> BalanceWidgetEntry {
        let entry = BalanceWidgetEntry(date: Date(), configuration: ConfigurationIntent(), hntPrice: 0, hntDailyEarnings: 0, balance: 0)
        return entry
    }

    // Get coin image name.
    static func getCoinImageName(_ symbol: String) -> String {
        switch symbol {
        case "HNT":
            return "hnt-logo"
        case "MOBILE":
            return "mobile-logo"
        case "HST":
            return "hst-logo"
        case "DC":
            return "data-credits-logo"
        default:
            return ""
        }
    }

    // Get balance from asset
    static func getCurrentBalance(asset: HeliumAsset) -> String {
        if asset.symbol == "DC" {
            return asset.balance.kmFormatted
        } else {
            return asset.balance.fromBones.kmFormatted
        }
    }

    // Calculate fiat balance.
    static func calculateFiatBalance(assetPrice: Double, assetBalance: Int) -> Double {
        let realBalance = assetBalance.fromBones
        return realBalance * assetPrice
    }

    // Get date string for date. Used for graphql queries to get past weeks and current week.
    static func getDateStringFrom(_ increment: Int, _ byDay: Bool) -> String {
        let date = Calendar(identifier: .iso8601).date(byAdding: byDay ? .day : .weekOfYear, value: increment, to: Date())!

        // Formatting to ISO8601 String
        let dateFormatter = DateFormatter()
        let enUSPosixLocale = Locale(identifier: "en_US_POSIX")
        dateFormatter.locale = enUSPosixLocale
        dateFormatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ssZZZZZ"
        dateFormatter.calendar = Calendar(identifier: .gregorian)

        return dateFormatter.string(from: date)
    }
}
