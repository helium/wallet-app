// @generated
//  This file was automatically generated and should not be edited.

import Apollo
import Foundation

public enum CurrencyType: RawRepresentable, Equatable, Hashable, CaseIterable, Apollo.JSONDecodable, Apollo.JSONEncodable {
    public typealias RawValue = String
    case aed
    case ars
    case aud
    case bch
    case bdt
    case bhd
    case bits
    case bmd
    case bnb
    case brl
    case btc
    case cad
    case chf
    case clp
    case cny
    case czk
    case dkk
    case dot
    case eos
    case eth
    case eur
    case gbp
    case hkd
    case huf
    case idr
    case ils
    case inr
    case jpy
    case krw
    case kwd
    case link
    case lkr
    case ltc
    case mmk
    case mxn
    case myr
    case ngn
    case nok
    case nzd
    case php
    case pkr
    case pln
    case rub
    case sar
    case sats
    case sek
    case sgd
    case thb
    case `try`
    case twd
    case uah
    case usd
    case vef
    case vnd
    case xag
    case xau
    case xdr
    case xlm
    case xrp
    case yfi
    case zar
    /// Auto generated constant for unknown enum values
    case __unknown(RawValue)

    public init?(rawValue: RawValue) {
        switch rawValue {
        case "AED": self = .aed
        case "ARS": self = .ars
        case "AUD": self = .aud
        case "BCH": self = .bch
        case "BDT": self = .bdt
        case "BHD": self = .bhd
        case "BITS": self = .bits
        case "BMD": self = .bmd
        case "BNB": self = .bnb
        case "BRL": self = .brl
        case "BTC": self = .btc
        case "CAD": self = .cad
        case "CHF": self = .chf
        case "CLP": self = .clp
        case "CNY": self = .cny
        case "CZK": self = .czk
        case "DKK": self = .dkk
        case "DOT": self = .dot
        case "EOS": self = .eos
        case "ETH": self = .eth
        case "EUR": self = .eur
        case "GBP": self = .gbp
        case "HKD": self = .hkd
        case "HUF": self = .huf
        case "IDR": self = .idr
        case "ILS": self = .ils
        case "INR": self = .inr
        case "JPY": self = .jpy
        case "KRW": self = .krw
        case "KWD": self = .kwd
        case "LINK": self = .link
        case "LKR": self = .lkr
        case "LTC": self = .ltc
        case "MMK": self = .mmk
        case "MXN": self = .mxn
        case "MYR": self = .myr
        case "NGN": self = .ngn
        case "NOK": self = .nok
        case "NZD": self = .nzd
        case "PHP": self = .php
        case "PKR": self = .pkr
        case "PLN": self = .pln
        case "RUB": self = .rub
        case "SAR": self = .sar
        case "SATS": self = .sats
        case "SEK": self = .sek
        case "SGD": self = .sgd
        case "THB": self = .thb
        case "TRY": self = .try
        case "TWD": self = .twd
        case "UAH": self = .uah
        case "USD": self = .usd
        case "VEF": self = .vef
        case "VND": self = .vnd
        case "XAG": self = .xag
        case "XAU": self = .xau
        case "XDR": self = .xdr
        case "XLM": self = .xlm
        case "XRP": self = .xrp
        case "YFI": self = .yfi
        case "ZAR": self = .zar
        default: self = .__unknown(rawValue)
        }
    }

    public var rawValue: RawValue {
        switch self {
        case .aed: return "AED"
        case .ars: return "ARS"
        case .aud: return "AUD"
        case .bch: return "BCH"
        case .bdt: return "BDT"
        case .bhd: return "BHD"
        case .bits: return "BITS"
        case .bmd: return "BMD"
        case .bnb: return "BNB"
        case .brl: return "BRL"
        case .btc: return "BTC"
        case .cad: return "CAD"
        case .chf: return "CHF"
        case .clp: return "CLP"
        case .cny: return "CNY"
        case .czk: return "CZK"
        case .dkk: return "DKK"
        case .dot: return "DOT"
        case .eos: return "EOS"
        case .eth: return "ETH"
        case .eur: return "EUR"
        case .gbp: return "GBP"
        case .hkd: return "HKD"
        case .huf: return "HUF"
        case .idr: return "IDR"
        case .ils: return "ILS"
        case .inr: return "INR"
        case .jpy: return "JPY"
        case .krw: return "KRW"
        case .kwd: return "KWD"
        case .link: return "LINK"
        case .lkr: return "LKR"
        case .ltc: return "LTC"
        case .mmk: return "MMK"
        case .mxn: return "MXN"
        case .myr: return "MYR"
        case .ngn: return "NGN"
        case .nok: return "NOK"
        case .nzd: return "NZD"
        case .php: return "PHP"
        case .pkr: return "PKR"
        case .pln: return "PLN"
        case .rub: return "RUB"
        case .sar: return "SAR"
        case .sats: return "SATS"
        case .sek: return "SEK"
        case .sgd: return "SGD"
        case .thb: return "THB"
        case .try: return "TRY"
        case .twd: return "TWD"
        case .uah: return "UAH"
        case .usd: return "USD"
        case .vef: return "VEF"
        case .vnd: return "VND"
        case .xag: return "XAG"
        case .xau: return "XAU"
        case .xdr: return "XDR"
        case .xlm: return "XLM"
        case .xrp: return "XRP"
        case .yfi: return "YFI"
        case .zar: return "ZAR"
        case let .__unknown(value): return value
        }
    }

    public static func == (lhs: CurrencyType, rhs: CurrencyType) -> Bool {
        switch (lhs, rhs) {
        case (.aed, .aed): return true
        case (.ars, .ars): return true
        case (.aud, .aud): return true
        case (.bch, .bch): return true
        case (.bdt, .bdt): return true
        case (.bhd, .bhd): return true
        case (.bits, .bits): return true
        case (.bmd, .bmd): return true
        case (.bnb, .bnb): return true
        case (.brl, .brl): return true
        case (.btc, .btc): return true
        case (.cad, .cad): return true
        case (.chf, .chf): return true
        case (.clp, .clp): return true
        case (.cny, .cny): return true
        case (.czk, .czk): return true
        case (.dkk, .dkk): return true
        case (.dot, .dot): return true
        case (.eos, .eos): return true
        case (.eth, .eth): return true
        case (.eur, .eur): return true
        case (.gbp, .gbp): return true
        case (.hkd, .hkd): return true
        case (.huf, .huf): return true
        case (.idr, .idr): return true
        case (.ils, .ils): return true
        case (.inr, .inr): return true
        case (.jpy, .jpy): return true
        case (.krw, .krw): return true
        case (.kwd, .kwd): return true
        case (.link, .link): return true
        case (.lkr, .lkr): return true
        case (.ltc, .ltc): return true
        case (.mmk, .mmk): return true
        case (.mxn, .mxn): return true
        case (.myr, .myr): return true
        case (.ngn, .ngn): return true
        case (.nok, .nok): return true
        case (.nzd, .nzd): return true
        case (.php, .php): return true
        case (.pkr, .pkr): return true
        case (.pln, .pln): return true
        case (.rub, .rub): return true
        case (.sar, .sar): return true
        case (.sats, .sats): return true
        case (.sek, .sek): return true
        case (.sgd, .sgd): return true
        case (.thb, .thb): return true
        case (.try, .try): return true
        case (.twd, .twd): return true
        case (.uah, .uah): return true
        case (.usd, .usd): return true
        case (.vef, .vef): return true
        case (.vnd, .vnd): return true
        case (.xag, .xag): return true
        case (.xau, .xau): return true
        case (.xdr, .xdr): return true
        case (.xlm, .xlm): return true
        case (.xrp, .xrp): return true
        case (.yfi, .yfi): return true
        case (.zar, .zar): return true
        case let (.__unknown(lhsValue), .__unknown(rhsValue)): return lhsValue == rhsValue
        default: return false
        }
    }

    public static var allCases: [CurrencyType] {
        return [
            .aed,
            .ars,
            .aud,
            .bch,
            .bdt,
            .bhd,
            .bits,
            .bmd,
            .bnb,
            .brl,
            .btc,
            .cad,
            .chf,
            .clp,
            .cny,
            .czk,
            .dkk,
            .dot,
            .eos,
            .eth,
            .eur,
            .gbp,
            .hkd,
            .huf,
            .idr,
            .ils,
            .inr,
            .jpy,
            .krw,
            .kwd,
            .link,
            .lkr,
            .ltc,
            .mmk,
            .mxn,
            .myr,
            .ngn,
            .nok,
            .nzd,
            .php,
            .pkr,
            .pln,
            .rub,
            .sar,
            .sats,
            .sek,
            .sgd,
            .thb,
            .try,
            .twd,
            .uah,
            .usd,
            .vef,
            .vnd,
            .xag,
            .xau,
            .xdr,
            .xlm,
            .xrp,
            .yfi,
            .zar,
        ]
    }
}

public final class WidgetDataQuery: GraphQLQuery {
    /// The raw GraphQL definition of this operation.
    public let operationDefinition: String =
        """
        query widgetData($address: String!, $type: CurrencyType!, $minTime: String, $midTime: String, $maxTime: String) {
          pricing(address: $address) {
            __typename
            hnt {
              __typename
              usd
            }
          }
          account(address: $address) {
            __typename
            address
            balance
            block
            dcBalance
            mobileBalance
            iotBalance
            dcNonce
            nonce
            secBalance
            secNonce
            speculativeNonce
            speculativeSecNonce
            stakedBalance
          }
          prevRewards: accountRewardsSum(
            address: $address
            minTime: $minTime
            maxTime: $midTime
          ) {
            __typename
            data {
              __typename
              total
              max
              median
              min
              stddev
              sum
            }
            meta {
              __typename
              maxTime
              minTime
            }
          }
          currentRewards: accountRewardsSum(
            address: $address
            minTime: $midTime
            maxTime: $maxTime
          ) {
            __typename
            data {
              __typename
              total
              max
              median
              min
              stddev
              sum
            }
            meta {
              __typename
              maxTime
              minTime
            }
          }
          accountBalanceHistory(address: $address, currencyType: $type) {
            __typename
            hntBalance
            stakedHntBalance
            iotBalance
            mobileBalance
            date
            hntPrice
            balance
          }
          currentPrices(address: $address, currencyType: $type) {
            __typename
            hnt
            mobile
            iot
          }
        }
        """

    public let operationName: String = "widgetData"

    public var address: String
    public var type: CurrencyType
    public var minTime: String?
    public var midTime: String?
    public var maxTime: String?

    public init(address: String, type: CurrencyType, minTime: String? = nil, midTime: String? = nil, maxTime: String? = nil) {
        self.address = address
        self.type = type
        self.minTime = minTime
        self.midTime = midTime
        self.maxTime = maxTime
    }

    public var variables: GraphQLMap? {
        return ["address": address, "type": type, "minTime": minTime, "midTime": midTime, "maxTime": maxTime]
    }

    public struct Data: GraphQLSelectionSet {
        public static let possibleTypes: [String] = ["RootQueryType"]

        public static var selections: [GraphQLSelection] {
            return [
                GraphQLField("pricing", arguments: ["address": GraphQLVariable("address")], type: .object(Pricing.selections)),
                GraphQLField("account", arguments: ["address": GraphQLVariable("address")], type: .object(Account.selections)),
                GraphQLField("accountRewardsSum", alias: "prevRewards", arguments: ["address": GraphQLVariable("address"), "minTime": GraphQLVariable("minTime"), "maxTime": GraphQLVariable("midTime")], type: .object(PrevReward.selections)),
                GraphQLField("accountRewardsSum", alias: "currentRewards", arguments: ["address": GraphQLVariable("address"), "minTime": GraphQLVariable("midTime"), "maxTime": GraphQLVariable("maxTime")], type: .object(CurrentReward.selections)),
                GraphQLField("accountBalanceHistory", arguments: ["address": GraphQLVariable("address"), "currencyType": GraphQLVariable("type")], type: .list(.nonNull(.object(AccountBalanceHistory.selections)))),
                GraphQLField("currentPrices", arguments: ["address": GraphQLVariable("address"), "currencyType": GraphQLVariable("type")], type: .object(CurrentPrice.selections)),
            ]
        }

        public private(set) var resultMap: ResultMap

        public init(unsafeResultMap: ResultMap) {
            resultMap = unsafeResultMap
        }

        public init(pricing: Pricing? = nil, account: Account? = nil, prevRewards: PrevReward? = nil, currentRewards: CurrentReward? = nil, accountBalanceHistory: [AccountBalanceHistory]? = nil, currentPrices: CurrentPrice? = nil) {
            self.init(unsafeResultMap: ["__typename": "RootQueryType", "pricing": pricing.flatMap { (value: Pricing) -> ResultMap in value.resultMap }, "account": account.flatMap { (value: Account) -> ResultMap in value.resultMap }, "prevRewards": prevRewards.flatMap { (value: PrevReward) -> ResultMap in value.resultMap }, "currentRewards": currentRewards.flatMap { (value: CurrentReward) -> ResultMap in value.resultMap }, "accountBalanceHistory": accountBalanceHistory.flatMap { (value: [AccountBalanceHistory]) -> [ResultMap] in value.map { (value: AccountBalanceHistory) -> ResultMap in value.resultMap } }, "currentPrices": currentPrices.flatMap { (value: CurrentPrice) -> ResultMap in value.resultMap }])
        }

        /// Get coin gecko prices
        @available(*, deprecated, message: "Use other price queries and specify currency type")
        public var pricing: Pricing? {
            get {
                return (resultMap["pricing"] as? ResultMap).flatMap { Pricing(unsafeResultMap: $0) }
            }
            set {
                resultMap.updateValue(newValue?.resultMap, forKey: "pricing")
            }
        }

        /// Get account
        public var account: Account? {
            get {
                return (resultMap["account"] as? ResultMap).flatMap { Account(unsafeResultMap: $0) }
            }
            set {
                resultMap.updateValue(newValue?.resultMap, forKey: "account")
            }
        }

        /// Get account rewards sum
        public var prevRewards: PrevReward? {
            get {
                return (resultMap["prevRewards"] as? ResultMap).flatMap { PrevReward(unsafeResultMap: $0) }
            }
            set {
                resultMap.updateValue(newValue?.resultMap, forKey: "prevRewards")
            }
        }

        /// Get account rewards sum
        public var currentRewards: CurrentReward? {
            get {
                return (resultMap["currentRewards"] as? ResultMap).flatMap { CurrentReward(unsafeResultMap: $0) }
            }
            set {
                resultMap.updateValue(newValue?.resultMap, forKey: "currentRewards")
            }
        }

        /// Get account balance history
        public var accountBalanceHistory: [AccountBalanceHistory]? {
            get {
                return (resultMap["accountBalanceHistory"] as? [ResultMap]).flatMap { (value: [ResultMap]) -> [AccountBalanceHistory] in value.map { (value: ResultMap) -> AccountBalanceHistory in AccountBalanceHistory(unsafeResultMap: value) } }
            }
            set {
                resultMap.updateValue(newValue.flatMap { (value: [AccountBalanceHistory]) -> [ResultMap] in value.map { (value: AccountBalanceHistory) -> ResultMap in value.resultMap } }, forKey: "accountBalanceHistory")
            }
        }

        /// Get current price
        public var currentPrices: CurrentPrice? {
            get {
                return (resultMap["currentPrices"] as? ResultMap).flatMap { CurrentPrice(unsafeResultMap: $0) }
            }
            set {
                resultMap.updateValue(newValue?.resultMap, forKey: "currentPrices")
            }
        }

        public struct Pricing: GraphQLSelectionSet {
            public static let possibleTypes: [String] = ["Prices"]

            public static var selections: [GraphQLSelection] {
                return [
                    GraphQLField("__typename", type: .nonNull(.scalar(String.self))),
                    GraphQLField("hnt", type: .nonNull(.object(Hnt.selections))),
                ]
            }

            public private(set) var resultMap: ResultMap

            public init(unsafeResultMap: ResultMap) {
                resultMap = unsafeResultMap
            }

            public init(hnt: Hnt) {
                self.init(unsafeResultMap: ["__typename": "Prices", "hnt": hnt.resultMap])
            }

            public var __typename: String {
                get {
                    return resultMap["__typename"]! as! String
                }
                set {
                    resultMap.updateValue(newValue, forKey: "__typename")
                }
            }

            public var hnt: Hnt {
                get {
                    return Hnt(unsafeResultMap: resultMap["hnt"]! as! ResultMap)
                }
                set {
                    resultMap.updateValue(newValue.resultMap, forKey: "hnt")
                }
            }

            public struct Hnt: GraphQLSelectionSet {
                public static let possibleTypes: [String] = ["Pricing"]

                public static var selections: [GraphQLSelection] {
                    return [
                        GraphQLField("__typename", type: .nonNull(.scalar(String.self))),
                        GraphQLField("usd", type: .scalar(Double.self)),
                    ]
                }

                public private(set) var resultMap: ResultMap

                public init(unsafeResultMap: ResultMap) {
                    resultMap = unsafeResultMap
                }

                public init(usd: Double? = nil) {
                    self.init(unsafeResultMap: ["__typename": "Pricing", "usd": usd])
                }

                public var __typename: String {
                    get {
                        return resultMap["__typename"]! as! String
                    }
                    set {
                        resultMap.updateValue(newValue, forKey: "__typename")
                    }
                }

                public var usd: Double? {
                    get {
                        return resultMap["usd"] as? Double
                    }
                    set {
                        resultMap.updateValue(newValue, forKey: "usd")
                    }
                }
            }
        }

        public struct Account: GraphQLSelectionSet {
            public static let possibleTypes: [String] = ["AccountData"]

            public static var selections: [GraphQLSelection] {
                return [
                    GraphQLField("__typename", type: .nonNull(.scalar(String.self))),
                    GraphQLField("address", type: .nonNull(.scalar(String.self))),
                    GraphQLField("balance", type: .nonNull(.scalar(Int.self))),
                    GraphQLField("block", type: .scalar(Int.self)),
                    GraphQLField("dcBalance", type: .nonNull(.scalar(Int.self))),
                    GraphQLField("mobileBalance", type: .scalar(Int.self)),
                    GraphQLField("iotBalance", type: .scalar(Int.self)),
                    GraphQLField("dcNonce", type: .nonNull(.scalar(Int.self))),
                    GraphQLField("nonce", type: .nonNull(.scalar(Int.self))),
                    GraphQLField("secBalance", type: .nonNull(.scalar(Int.self))),
                    GraphQLField("secNonce", type: .nonNull(.scalar(Int.self))),
                    GraphQLField("speculativeNonce", type: .scalar(Int.self)),
                    GraphQLField("speculativeSecNonce", type: .scalar(Int.self)),
                    GraphQLField("stakedBalance", type: .nonNull(.scalar(Int.self))),
                ]
            }

            public private(set) var resultMap: ResultMap

            public init(unsafeResultMap: ResultMap) {
                resultMap = unsafeResultMap
            }

            public init(address: String, balance: Int, block: Int? = nil, dcBalance: Int, mobileBalance: Int? = nil, iotBalance: Int? = nil, dcNonce: Int, nonce: Int, secBalance: Int, secNonce: Int, speculativeNonce: Int? = nil, speculativeSecNonce: Int? = nil, stakedBalance: Int) {
                self.init(unsafeResultMap: ["__typename": "AccountData", "address": address, "balance": balance, "block": block, "dcBalance": dcBalance, "mobileBalance": mobileBalance, "iotBalance": iotBalance, "dcNonce": dcNonce, "nonce": nonce, "secBalance": secBalance, "secNonce": secNonce, "speculativeNonce": speculativeNonce, "speculativeSecNonce": speculativeSecNonce, "stakedBalance": stakedBalance])
            }

            public var __typename: String {
                get {
                    return resultMap["__typename"]! as! String
                }
                set {
                    resultMap.updateValue(newValue, forKey: "__typename")
                }
            }

            public var address: String {
                get {
                    return resultMap["address"]! as! String
                }
                set {
                    resultMap.updateValue(newValue, forKey: "address")
                }
            }

            public var balance: Int {
                get {
                    return resultMap["balance"]! as! Int
                }
                set {
                    resultMap.updateValue(newValue, forKey: "balance")
                }
            }

            public var block: Int? {
                get {
                    return resultMap["block"] as? Int
                }
                set {
                    resultMap.updateValue(newValue, forKey: "block")
                }
            }

            public var dcBalance: Int {
                get {
                    return resultMap["dcBalance"]! as! Int
                }
                set {
                    resultMap.updateValue(newValue, forKey: "dcBalance")
                }
            }

            public var mobileBalance: Int? {
                get {
                    return resultMap["mobileBalance"] as? Int
                }
                set {
                    resultMap.updateValue(newValue, forKey: "mobileBalance")
                }
            }

            public var iotBalance: Int? {
                get {
                    return resultMap["iotBalance"] as? Int
                }
                set {
                    resultMap.updateValue(newValue, forKey: "iotBalance")
                }
            }

            public var dcNonce: Int {
                get {
                    return resultMap["dcNonce"]! as! Int
                }
                set {
                    resultMap.updateValue(newValue, forKey: "dcNonce")
                }
            }

            public var nonce: Int {
                get {
                    return resultMap["nonce"]! as! Int
                }
                set {
                    resultMap.updateValue(newValue, forKey: "nonce")
                }
            }

            public var secBalance: Int {
                get {
                    return resultMap["secBalance"]! as! Int
                }
                set {
                    resultMap.updateValue(newValue, forKey: "secBalance")
                }
            }

            public var secNonce: Int {
                get {
                    return resultMap["secNonce"]! as! Int
                }
                set {
                    resultMap.updateValue(newValue, forKey: "secNonce")
                }
            }

            public var speculativeNonce: Int? {
                get {
                    return resultMap["speculativeNonce"] as? Int
                }
                set {
                    resultMap.updateValue(newValue, forKey: "speculativeNonce")
                }
            }

            public var speculativeSecNonce: Int? {
                get {
                    return resultMap["speculativeSecNonce"] as? Int
                }
                set {
                    resultMap.updateValue(newValue, forKey: "speculativeSecNonce")
                }
            }

            public var stakedBalance: Int {
                get {
                    return resultMap["stakedBalance"]! as! Int
                }
                set {
                    resultMap.updateValue(newValue, forKey: "stakedBalance")
                }
            }
        }

        public struct PrevReward: GraphQLSelectionSet {
            public static let possibleTypes: [String] = ["Sum"]

            public static var selections: [GraphQLSelection] {
                return [
                    GraphQLField("__typename", type: .nonNull(.scalar(String.self))),
                    GraphQLField("data", type: .nonNull(.object(Datum.selections))),
                    GraphQLField("meta", type: .nonNull(.object(Metum.selections))),
                ]
            }

            public private(set) var resultMap: ResultMap

            public init(unsafeResultMap: ResultMap) {
                resultMap = unsafeResultMap
            }

            public init(data: Datum, meta: Metum) {
                self.init(unsafeResultMap: ["__typename": "Sum", "data": data.resultMap, "meta": meta.resultMap])
            }

            public var __typename: String {
                get {
                    return resultMap["__typename"]! as! String
                }
                set {
                    resultMap.updateValue(newValue, forKey: "__typename")
                }
            }

            public var data: Datum {
                get {
                    return Datum(unsafeResultMap: resultMap["data"]! as! ResultMap)
                }
                set {
                    resultMap.updateValue(newValue.resultMap, forKey: "data")
                }
            }

            public var meta: Metum {
                get {
                    return Metum(unsafeResultMap: resultMap["meta"]! as! ResultMap)
                }
                set {
                    resultMap.updateValue(newValue.resultMap, forKey: "meta")
                }
            }

            public struct Datum: GraphQLSelectionSet {
                public static let possibleTypes: [String] = ["SumData"]

                public static var selections: [GraphQLSelection] {
                    return [
                        GraphQLField("__typename", type: .nonNull(.scalar(String.self))),
                        GraphQLField("total", type: .nonNull(.scalar(Double.self))),
                        GraphQLField("max", type: .nonNull(.scalar(Double.self))),
                        GraphQLField("median", type: .nonNull(.scalar(Double.self))),
                        GraphQLField("min", type: .nonNull(.scalar(Double.self))),
                        GraphQLField("stddev", type: .nonNull(.scalar(Double.self))),
                        GraphQLField("sum", type: .nonNull(.scalar(Int.self))),
                    ]
                }

                public private(set) var resultMap: ResultMap

                public init(unsafeResultMap: ResultMap) {
                    resultMap = unsafeResultMap
                }

                public init(total: Double, max: Double, median: Double, min: Double, stddev: Double, sum: Int) {
                    self.init(unsafeResultMap: ["__typename": "SumData", "total": total, "max": max, "median": median, "min": min, "stddev": stddev, "sum": sum])
                }

                public var __typename: String {
                    get {
                        return resultMap["__typename"]! as! String
                    }
                    set {
                        resultMap.updateValue(newValue, forKey: "__typename")
                    }
                }

                public var total: Double {
                    get {
                        return resultMap["total"]! as! Double
                    }
                    set {
                        resultMap.updateValue(newValue, forKey: "total")
                    }
                }

                public var max: Double {
                    get {
                        return resultMap["max"]! as! Double
                    }
                    set {
                        resultMap.updateValue(newValue, forKey: "max")
                    }
                }

                public var median: Double {
                    get {
                        return resultMap["median"]! as! Double
                    }
                    set {
                        resultMap.updateValue(newValue, forKey: "median")
                    }
                }

                public var min: Double {
                    get {
                        return resultMap["min"]! as! Double
                    }
                    set {
                        resultMap.updateValue(newValue, forKey: "min")
                    }
                }

                public var stddev: Double {
                    get {
                        return resultMap["stddev"]! as! Double
                    }
                    set {
                        resultMap.updateValue(newValue, forKey: "stddev")
                    }
                }

                public var sum: Int {
                    get {
                        return resultMap["sum"]! as! Int
                    }
                    set {
                        resultMap.updateValue(newValue, forKey: "sum")
                    }
                }
            }

            public struct Metum: GraphQLSelectionSet {
                public static let possibleTypes: [String] = ["SumMeta"]

                public static var selections: [GraphQLSelection] {
                    return [
                        GraphQLField("__typename", type: .nonNull(.scalar(String.self))),
                        GraphQLField("maxTime", type: .nonNull(.scalar(String.self))),
                        GraphQLField("minTime", type: .nonNull(.scalar(String.self))),
                    ]
                }

                public private(set) var resultMap: ResultMap

                public init(unsafeResultMap: ResultMap) {
                    resultMap = unsafeResultMap
                }

                public init(maxTime: String, minTime: String) {
                    self.init(unsafeResultMap: ["__typename": "SumMeta", "maxTime": maxTime, "minTime": minTime])
                }

                public var __typename: String {
                    get {
                        return resultMap["__typename"]! as! String
                    }
                    set {
                        resultMap.updateValue(newValue, forKey: "__typename")
                    }
                }

                public var maxTime: String {
                    get {
                        return resultMap["maxTime"]! as! String
                    }
                    set {
                        resultMap.updateValue(newValue, forKey: "maxTime")
                    }
                }

                public var minTime: String {
                    get {
                        return resultMap["minTime"]! as! String
                    }
                    set {
                        resultMap.updateValue(newValue, forKey: "minTime")
                    }
                }
            }
        }

        public struct CurrentReward: GraphQLSelectionSet {
            public static let possibleTypes: [String] = ["Sum"]

            public static var selections: [GraphQLSelection] {
                return [
                    GraphQLField("__typename", type: .nonNull(.scalar(String.self))),
                    GraphQLField("data", type: .nonNull(.object(Datum.selections))),
                    GraphQLField("meta", type: .nonNull(.object(Metum.selections))),
                ]
            }

            public private(set) var resultMap: ResultMap

            public init(unsafeResultMap: ResultMap) {
                resultMap = unsafeResultMap
            }

            public init(data: Datum, meta: Metum) {
                self.init(unsafeResultMap: ["__typename": "Sum", "data": data.resultMap, "meta": meta.resultMap])
            }

            public var __typename: String {
                get {
                    return resultMap["__typename"]! as! String
                }
                set {
                    resultMap.updateValue(newValue, forKey: "__typename")
                }
            }

            public var data: Datum {
                get {
                    return Datum(unsafeResultMap: resultMap["data"]! as! ResultMap)
                }
                set {
                    resultMap.updateValue(newValue.resultMap, forKey: "data")
                }
            }

            public var meta: Metum {
                get {
                    return Metum(unsafeResultMap: resultMap["meta"]! as! ResultMap)
                }
                set {
                    resultMap.updateValue(newValue.resultMap, forKey: "meta")
                }
            }

            public struct Datum: GraphQLSelectionSet {
                public static let possibleTypes: [String] = ["SumData"]

                public static var selections: [GraphQLSelection] {
                    return [
                        GraphQLField("__typename", type: .nonNull(.scalar(String.self))),
                        GraphQLField("total", type: .nonNull(.scalar(Double.self))),
                        GraphQLField("max", type: .nonNull(.scalar(Double.self))),
                        GraphQLField("median", type: .nonNull(.scalar(Double.self))),
                        GraphQLField("min", type: .nonNull(.scalar(Double.self))),
                        GraphQLField("stddev", type: .nonNull(.scalar(Double.self))),
                        GraphQLField("sum", type: .nonNull(.scalar(Int.self))),
                    ]
                }

                public private(set) var resultMap: ResultMap

                public init(unsafeResultMap: ResultMap) {
                    resultMap = unsafeResultMap
                }

                public init(total: Double, max: Double, median: Double, min: Double, stddev: Double, sum: Int) {
                    self.init(unsafeResultMap: ["__typename": "SumData", "total": total, "max": max, "median": median, "min": min, "stddev": stddev, "sum": sum])
                }

                public var __typename: String {
                    get {
                        return resultMap["__typename"]! as! String
                    }
                    set {
                        resultMap.updateValue(newValue, forKey: "__typename")
                    }
                }

                public var total: Double {
                    get {
                        return resultMap["total"]! as! Double
                    }
                    set {
                        resultMap.updateValue(newValue, forKey: "total")
                    }
                }

                public var max: Double {
                    get {
                        return resultMap["max"]! as! Double
                    }
                    set {
                        resultMap.updateValue(newValue, forKey: "max")
                    }
                }

                public var median: Double {
                    get {
                        return resultMap["median"]! as! Double
                    }
                    set {
                        resultMap.updateValue(newValue, forKey: "median")
                    }
                }

                public var min: Double {
                    get {
                        return resultMap["min"]! as! Double
                    }
                    set {
                        resultMap.updateValue(newValue, forKey: "min")
                    }
                }

                public var stddev: Double {
                    get {
                        return resultMap["stddev"]! as! Double
                    }
                    set {
                        resultMap.updateValue(newValue, forKey: "stddev")
                    }
                }

                public var sum: Int {
                    get {
                        return resultMap["sum"]! as! Int
                    }
                    set {
                        resultMap.updateValue(newValue, forKey: "sum")
                    }
                }
            }

            public struct Metum: GraphQLSelectionSet {
                public static let possibleTypes: [String] = ["SumMeta"]

                public static var selections: [GraphQLSelection] {
                    return [
                        GraphQLField("__typename", type: .nonNull(.scalar(String.self))),
                        GraphQLField("maxTime", type: .nonNull(.scalar(String.self))),
                        GraphQLField("minTime", type: .nonNull(.scalar(String.self))),
                    ]
                }

                public private(set) var resultMap: ResultMap

                public init(unsafeResultMap: ResultMap) {
                    resultMap = unsafeResultMap
                }

                public init(maxTime: String, minTime: String) {
                    self.init(unsafeResultMap: ["__typename": "SumMeta", "maxTime": maxTime, "minTime": minTime])
                }

                public var __typename: String {
                    get {
                        return resultMap["__typename"]! as! String
                    }
                    set {
                        resultMap.updateValue(newValue, forKey: "__typename")
                    }
                }

                public var maxTime: String {
                    get {
                        return resultMap["maxTime"]! as! String
                    }
                    set {
                        resultMap.updateValue(newValue, forKey: "maxTime")
                    }
                }

                public var minTime: String {
                    get {
                        return resultMap["minTime"]! as! String
                    }
                    set {
                        resultMap.updateValue(newValue, forKey: "minTime")
                    }
                }
            }
        }

        public struct AccountBalanceHistory: GraphQLSelectionSet {
            public static let possibleTypes: [String] = ["AccountBalance"]

            public static var selections: [GraphQLSelection] {
                return [
                    GraphQLField("__typename", type: .nonNull(.scalar(String.self))),
                    GraphQLField("hntBalance", type: .nonNull(.scalar(Int.self))),
                    GraphQLField("stakedHntBalance", type: .nonNull(.scalar(Int.self))),
                    GraphQLField("iotBalance", type: .nonNull(.scalar(Int.self))),
                    GraphQLField("mobileBalance", type: .nonNull(.scalar(Int.self))),
                    GraphQLField("date", type: .nonNull(.scalar(String.self))),
                    GraphQLField("hntPrice", type: .nonNull(.scalar(Double.self))),
                    GraphQLField("balance", type: .nonNull(.scalar(Double.self))),
                ]
            }

            public private(set) var resultMap: ResultMap

            public init(unsafeResultMap: ResultMap) {
                resultMap = unsafeResultMap
            }

            public init(hntBalance: Int, stakedHntBalance: Int, iotBalance: Int, mobileBalance: Int, date: String, hntPrice: Double, balance: Double) {
                self.init(unsafeResultMap: ["__typename": "AccountBalance", "hntBalance": hntBalance, "stakedHntBalance": stakedHntBalance, "iotBalance": iotBalance, "mobileBalance": mobileBalance, "date": date, "hntPrice": hntPrice, "balance": balance])
            }

            public var __typename: String {
                get {
                    return resultMap["__typename"]! as! String
                }
                set {
                    resultMap.updateValue(newValue, forKey: "__typename")
                }
            }

            public var hntBalance: Int {
                get {
                    return resultMap["hntBalance"]! as! Int
                }
                set {
                    resultMap.updateValue(newValue, forKey: "hntBalance")
                }
            }

            public var stakedHntBalance: Int {
                get {
                    return resultMap["stakedHntBalance"]! as! Int
                }
                set {
                    resultMap.updateValue(newValue, forKey: "stakedHntBalance")
                }
            }

            public var iotBalance: Int {
                get {
                    return resultMap["iotBalance"]! as! Int
                }
                set {
                    resultMap.updateValue(newValue, forKey: "iotBalance")
                }
            }

            public var mobileBalance: Int {
                get {
                    return resultMap["mobileBalance"]! as! Int
                }
                set {
                    resultMap.updateValue(newValue, forKey: "mobileBalance")
                }
            }

            public var date: String {
                get {
                    return resultMap["date"]! as! String
                }
                set {
                    resultMap.updateValue(newValue, forKey: "date")
                }
            }

            public var hntPrice: Double {
                get {
                    return resultMap["hntPrice"]! as! Double
                }
                set {
                    resultMap.updateValue(newValue, forKey: "hntPrice")
                }
            }

            public var balance: Double {
                get {
                    return resultMap["balance"]! as! Double
                }
                set {
                    resultMap.updateValue(newValue, forKey: "balance")
                }
            }
        }

        public struct CurrentPrice: GraphQLSelectionSet {
            public static let possibleTypes: [String] = ["CurrentPrices"]

            public static var selections: [GraphQLSelection] {
                return [
                    GraphQLField("__typename", type: .nonNull(.scalar(String.self))),
                    GraphQLField("hnt", type: .nonNull(.scalar(Double.self))),
                    GraphQLField("mobile", type: .nonNull(.scalar(Double.self))),
                    GraphQLField("iot", type: .nonNull(.scalar(Double.self))),
                ]
            }

            public private(set) var resultMap: ResultMap

            public init(unsafeResultMap: ResultMap) {
                resultMap = unsafeResultMap
            }

            public init(hnt: Double, mobile: Double, iot: Double) {
                self.init(unsafeResultMap: ["__typename": "CurrentPrices", "hnt": hnt, "mobile": mobile, "iot": iot])
            }

            public var __typename: String {
                get {
                    return resultMap["__typename"]! as! String
                }
                set {
                    resultMap.updateValue(newValue, forKey: "__typename")
                }
            }

            public var hnt: Double {
                get {
                    return resultMap["hnt"]! as! Double
                }
                set {
                    resultMap.updateValue(newValue, forKey: "hnt")
                }
            }

            public var mobile: Double {
                get {
                    return resultMap["mobile"]! as! Double
                }
                set {
                    resultMap.updateValue(newValue, forKey: "mobile")
                }
            }

            public var iot: Double {
                get {
                    return resultMap["iot"]! as! Double
                }
                set {
                    resultMap.updateValue(newValue, forKey: "iot")
                }
            }
        }
    }
}
