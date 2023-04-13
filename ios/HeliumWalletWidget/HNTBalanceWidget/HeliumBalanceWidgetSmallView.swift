//
//  HeliumBalanceWidgetEntryView.swift
//  Helium
//
//  Created by Luis F. Perrone on 1/18/22.
//

import Intents
import SwiftUI
import WidgetKit

struct HeliumBalanceWidgetSmallView: View {
    var entry: HNTBalanceWidgetProvider.Entry

    var body: some View {
        VStack(alignment: .leading) {
            Spacer()
            HStack(spacing: 0) {
                Image("hnt-logo").resizable()
                    .frame(width: 32.0, height: 32.0)
                Spacer()
                VStack(alignment: .trailing, spacing: 4) {
                    Text("Helium (HNT)")
                        .bold()
                        .font(.system(size: 10.0)).foregroundColor(.white)
                  Text("$\(String(format: "%.2f", entry.widgetData.heliumPrice))")
                        .font(.system(size: 12.0)).foregroundColor(.white)
                }
            }
            Divider()
            Spacer()
            HStack(alignment: .center) {
              Text("HNT_BALANCE", comment: "Wallet title for users wallet.")
                  .font(.system(size: 12.0)).foregroundColor(.white)
              Spacer()
              Text(entry.widgetData.hntBalance.kmFormatted)
                    .bold()
                    .font(.system(size: 12.0)).foregroundColor(.white)
            }
            Spacer()
            Divider()
            Spacer()

            HStack(spacing: 0) {
                Text("SOL_BALANCE", comment: "Wallet title for users wallet.")
                    .font(.system(size: 12.0)).foregroundColor(.white)
                Spacer()
              Text(entry.widgetData.solBalance.kmFormatted)
                    .bold()
                    .font(.system(size: 12.0)).foregroundColor(.white)
            }
            Spacer()
        }.padding(10).background(Color("WidgetBackground"))
    }

    func dateToShortFormat() -> String {
        // Getting yesterdays date object
        let yesterday = Date().dayBefore
        let dateFormatter = DateFormatter()
        dateFormatter.timeZone = TimeZone.current
        dateFormatter.dateFormat = "MMM d"
        return dateFormatter.string(from: yesterday)
    }
}

extension Date {
    var dayBefore: Date {
        return Calendar.current.date(byAdding: .day, value: -1, to: self)!
    }
}
