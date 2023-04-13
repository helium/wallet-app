//
//  WidgetAPI.swift
//  HeliumWallet
//
//  Created by Luis Perrone on 4/11/23.
//

import Foundation

struct WidgetData: Decodable {
  var heliumPrice: Double
  var solanaPrice: Double
  var hntBalance: Double
  var mobileBalance: Double
  var iotBalance: Double
  var dcBalance: Int
  var solBalance: Double
  
  enum CodingKeys: String, CodingKey {
       case heliumPrice, solanaPrice, hntBalance, mobileBalance, iotBalance, dcBalance, solBalance
   }
  
  init(heliumPrice: Double, solanaPrice: Double, hntBalance: Double, mobileBalance: Double, iotBalance: Double, dcBalance: Int, solBalance: Double) {
    self.heliumPrice = heliumPrice
    self.solanaPrice = solanaPrice
    self.hntBalance = hntBalance
    self.mobileBalance = mobileBalance
    self.iotBalance = iotBalance
    self.dcBalance = dcBalance
    self.solBalance = solBalance
  }
  
  init(from decoder: Decoder) throws {
    let container = try decoder.container(keyedBy: CodingKeys.self)
    
    dcBalance = try container.decode(Int.self, forKey: .dcBalance)
    
    do {
      heliumPrice = try container.decode(Double.self, forKey: .heliumPrice)
      solanaPrice = try container.decode(Double.self, forKey: .solanaPrice)
      hntBalance = try container.decode(Double.self, forKey: .hntBalance)
      mobileBalance = try container.decode(Double.self, forKey: .mobileBalance)
      iotBalance = try container.decode(Double.self, forKey: .iotBalance)
      solBalance = try container.decode(Double.self, forKey: .solBalance)
    } catch DecodingError.typeMismatch {
      heliumPrice = try Double(container.decode(Int.self, forKey: .heliumPrice))
      solanaPrice = try  Double(container.decode(Int.self, forKey: .solanaPrice))
      hntBalance = try  Double(container.decode(Int.self, forKey: .hntBalance))
      mobileBalance = try  Double(container.decode(Int.self, forKey: .mobileBalance))
      iotBalance = try  Double(container.decode(Int.self, forKey: .iotBalance))
      solBalance = try  Double(container.decode(Int.self, forKey: .solBalance))
    }
  }
}

struct AccountBalance: Decodable {
  var hntBalance: Int
  var mobileBalance: Int
  var solBalance: Int
  var date: String
  var hntPrice: Double
  var balance: Double
  
  enum CodingKeys: String, CodingKey {
       case hntBalance, stakedHntBalance, iotBalance, mobileBalance, solBalance, date, hntPrice, balance
   }
  
  init(hntBalance: Int, mobileBalance: Int, solBalance: Int, date: String, hntPrice: Double, balance: Double) {
    self.hntBalance = hntBalance
    self.mobileBalance = mobileBalance
    self.solBalance = solBalance
    self.date = date
    self.hntPrice = hntPrice
    self.balance = balance
  }
  
  init(from decoder: Decoder) throws {
    let container = try decoder.container(keyedBy: CodingKeys.self)
    
    hntBalance = try container.decode(Int.self, forKey: .hntBalance)
    mobileBalance = try container.decode(Int.self, forKey: .mobileBalance)
    solBalance = try container.decode(Int.self, forKey: .solBalance)
    date = try container.decode(String.self, forKey: .date)

    do {
      hntPrice = try container.decode(Double.self, forKey: .hntPrice)
      balance = try container.decode(Double.self, forKey: .balance)
    } catch DecodingError.typeMismatch {
      hntPrice = try Double(container.decode(Int.self, forKey: .hntPrice))
      balance = try  Double(container.decode(Int.self, forKey: .balance))
    }
  }
}

struct WidgetChartData: Decodable {
  var chartData: [AccountBalance]?
  var widgetData: WidgetData?
}

class Network {
  static let shared = Network()
  // Fallback in case url from ReactNativeConfig fails
  var prodUrl = "https://wallet-api-v2.helium.com/api"
  // TODO: Fix
//  var url = ReactNativeConfig.env(for: "WALLET_REST_URI")
  private(set) lazy var clientUrl = prodUrl
  /**
   * Fetch balance widget data using both account rewards & account balance endpoints.
   */
  func getWidgetDataAndCharts(address: String, cluster: String, currency: String, completion: @escaping (Error?, WidgetChartData?) -> Void) {
    // Fetching widget data
    fetchWidgetData(address: address, cluster: cluster, currency: currency) { widgetDataError, widgetData in
      if (widgetDataError == nil) {
        // Fetch widget balance history
        self.fetchBalanceHistory(address: address, cluster: cluster, currency: currency) { balanceHistoryError, balanceHistoryData in
          if (balanceHistoryError == nil) {
            let parsedWidgetData = WidgetChartData(chartData: balanceHistoryData ?? [], widgetData: widgetData ?? nil)
            completion(nil, parsedWidgetData)
          } else {
            let parsedWidgetData = WidgetChartData(chartData: [], widgetData: widgetData)
            completion(nil, parsedWidgetData)
          }
        }
      }
    }
  }
  
  /**
   * Fetch widget data
   */
  func fetchWidgetData(address: String, cluster: String, currency: String, completion: @escaping (Error?, WidgetData?) -> Void) {
    let urlComps = URLComponents(string: "\(clientUrl)/widgetData?address=\(address)&cluster=\(cluster)&currency=\(currency.lowercased())")!
    let url = urlComps.url!
    
    var request = URLRequest(url: url)
    
    // Change the URLRequest to a GET request
    request.httpMethod = "GET"
    
    // Create the HTTP request
    let session = URLSession.shared
    let task = session.dataTask(with: request) { (data, response, error) in
      
      if let error = error {
        // Handle HTTP request error
        completion(error, nil)
      } else if let data = data {
        // Handle HTTP request response
        do {
          let response = try JSONDecoder().decode(WidgetData.self, from: data)
          completion(nil, response)
        }
        catch _ as NSError {
          fatalError("Couldn't fetch data from fetchWidgetData")
        }
      } else {
        // Handle unexpected error
        completion(nil,nil)
      }
    }
    
    task.resume()
  }
  
  
  /**
   * Fetch chart data
   */
  func fetchBalanceHistory(address: String, cluster: String, currency: String, completion: @escaping (Error?, [AccountBalance]?) -> Void) {
    let urlComps = URLComponents(string: "\(clientUrl)/balances/\(address)?cluster=\(cluster)&currency=\(currency.lowercased())")!
    
    let url = urlComps.url!
    
    var request = URLRequest(url: url)
    
    // Change the URLRequest to a GET request
    request.httpMethod = "GET"
    
    // Create the HTTP request
    let session = URLSession.shared
    let task = session.dataTask(with: request) { (data, response, error) in
      
      if let error = error {
        // Handle HTTP request error
        completion(error, nil)
      } else if let data = data {
        // Handle HTTP request response
        do {
          let response = try JSONDecoder().decode([AccountBalance].self, from: data)
          completion(nil, response)
        }
        catch _ as NSError {
          fatalError("Couldn't fetch data from fetchBalanceHistory")
        }
      } else {
        // Handle unexpected error
        completion(nil,nil)
      }
    }
    
    task.resume()
  }
}
