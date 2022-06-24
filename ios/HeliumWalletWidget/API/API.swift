// @generated
//  This file was automatically generated and should not be edited.

import Apollo
import Foundation

public final class WidgetDataQuery: GraphQLQuery {
    /// The raw GraphQL definition of this operation.
    public let operationDefinition: String =
        """
        query widgetData($address: String!, $minTime: String, $midTime: String, $maxTime: String) {
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
        }
        """

    public let operationName: String = "widgetData"

    public var address: String
    public var minTime: String?
    public var midTime: String?
    public var maxTime: String?

    public init(address: String, minTime: String? = nil, midTime: String? = nil, maxTime: String? = nil) {
        self.address = address
        self.minTime = minTime
        self.midTime = midTime
        self.maxTime = maxTime
    }

    public var variables: GraphQLMap? {
        return ["address": address, "minTime": minTime, "midTime": midTime, "maxTime": maxTime]
    }

    public struct Data: GraphQLSelectionSet {
        public static let possibleTypes: [String] = ["RootQueryType"]

        public static var selections: [GraphQLSelection] {
            return [
                GraphQLField("pricing", arguments: ["address": GraphQLVariable("address")], type: .object(Pricing.selections)),
                GraphQLField("account", arguments: ["address": GraphQLVariable("address")], type: .object(Account.selections)),
                GraphQLField("accountRewardsSum", alias: "prevRewards", arguments: ["address": GraphQLVariable("address"), "minTime": GraphQLVariable("minTime"), "maxTime": GraphQLVariable("midTime")], type: .object(PrevReward.selections)),
                GraphQLField("accountRewardsSum", alias: "currentRewards", arguments: ["address": GraphQLVariable("address"), "minTime": GraphQLVariable("midTime"), "maxTime": GraphQLVariable("maxTime")], type: .object(CurrentReward.selections)),
            ]
        }

        public private(set) var resultMap: ResultMap

        public init(unsafeResultMap: ResultMap) {
            resultMap = unsafeResultMap
        }

        public init(pricing: Pricing? = nil, account: Account? = nil, prevRewards: PrevReward? = nil, currentRewards: CurrentReward? = nil) {
            self.init(unsafeResultMap: ["__typename": "RootQueryType", "pricing": pricing.flatMap { (value: Pricing) -> ResultMap in value.resultMap }, "account": account.flatMap { (value: Account) -> ResultMap in value.resultMap }, "prevRewards": prevRewards.flatMap { (value: PrevReward) -> ResultMap in value.resultMap }, "currentRewards": currentRewards.flatMap { (value: CurrentReward) -> ResultMap in value.resultMap }])
        }

        /// Get coin gecko prices
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

            public init(address: String, balance: Int, block: Int? = nil, dcBalance: Int, dcNonce: Int, nonce: Int, secBalance: Int, secNonce: Int, speculativeNonce: Int? = nil, speculativeSecNonce: Int? = nil, stakedBalance: Int) {
                self.init(unsafeResultMap: ["__typename": "AccountData", "address": address, "balance": balance, "block": block, "dcBalance": dcBalance, "dcNonce": dcNonce, "nonce": nonce, "secBalance": secBalance, "secNonce": secNonce, "speculativeNonce": speculativeNonce, "speculativeSecNonce": speculativeSecNonce, "stakedBalance": stakedBalance])
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
    }
}
