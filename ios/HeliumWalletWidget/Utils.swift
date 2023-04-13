//
//  Utils.swift
//  HeliumWalletWidgetExtension
//
//  Created by Luis Perrone on 6/8/22.
//

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
  static func mockAccountDetails() -> WidgetChartData {
    let widgetData = WidgetData(heliumPrice: 200.28, solanaPrice: 400.20, hntBalance: 400.29837485, mobileBalance: 329.948764, iotBalance: 196.233847, dcBalance: 320, solBalance: 42.592758932)
    let chartData = AccountBalance(hntBalance: 23, mobileBalance: 329, solBalance: 0, date: "Tue Apr 11 2023 14:52:12 GMT-0400 (Eastern Daylight Time)", hntPrice: 3.29, balance: 329)
    let widgetChartData = WidgetChartData(chartData: [chartData, chartData], widgetData: widgetData)
    return widgetChartData
  }
  
  // Empty account details for when Network issues occur
  static func emptyAccountDetails() -> WidgetChartData {
    let widgetData = WidgetData(heliumPrice: 0, solanaPrice: 0, hntBalance: 0, mobileBalance: 0, iotBalance: 0, dcBalance: 0, solBalance: 0)
    let widgetChartData = WidgetChartData(chartData: [], widgetData: widgetData)
    return widgetChartData
  }
  
  static func emptyHNTBalanceWidgetDetails() -> WidgetData {
    let widgetData = WidgetData(heliumPrice: 0, solanaPrice: 0, hntBalance: 0, mobileBalance: 0, iotBalance: 0, dcBalance: 0, solBalance: 0)
    return widgetData
  }
  
  static func mockHNTBalanceWidget() -> WidgetData {
    let widgetData = WidgetData(heliumPrice: 200.28, solanaPrice: 400.20, hntBalance: 400.29837485, mobileBalance: 329.948764, iotBalance: 196.233847, dcBalance: 320, solBalance: 42.592758932)
    return widgetData
  }
  
  // Get coin image name.
  static func getCoinImageName(_ symbol: String) -> String {
    switch symbol {
    case "HNT":
      return "hnt-logo"
    case "SOL":
      return "sol-logo"
    case "MOBILE":
      return "MOBILE"
    case "IOT":
      return "iot-logo"
    case "HST":
      return "hst-logo"
    case "DC":
      return "data-credits-logo"
    default:
      return ""
    }
  }
  
  // Calculate fiat balance.
  static func calculateFiatBalance(assetPrice: Double, assetBalance: Double) -> Double {
    return assetBalance * assetPrice
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
  
  static func convertBalanceHistoryToChartData(history: [AccountBalance]) -> [Double]  {
    var chartValues: [Double] = []
    
    let balanceHis = history.map { $0.balance }
    let maxBalance = balanceHis.max()
    let minBalance = balanceHis.min()
    
    // Calculate diff to use as divisor to get a number between 0 and 1 for Charts Package
    let diff = (maxBalance ?? 0.0) - (minBalance ?? 0.0)
    
    for (_, element) in history.enumerated() {
      if diff != 0 {
        chartValues.append((element.balance - minBalance!) / diff)
      } else {
        chartValues.append(0.5)
      }
    }
    return chartValues
  }
}
