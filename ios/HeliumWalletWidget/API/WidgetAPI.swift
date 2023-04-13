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
}

struct AccountBalance: Decodable {
  var hntBalance: Int
  var stakedHntBalance: Int?
  var iotBalance: Int?
  var mobileBalance: Int
  var solBalance: Int?
  var date: String
  var hntPrice: Double
  var balance: Double
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
    let urlComps = URLComponents(string: "\(clientUrl)/widgetData?address=\(address)?cluster=\(cluster)?currency=\(currency.lowercased())")!
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
