//
//  AddressGen.swift
//  JazziconSwift
//
//  Created by Chung Tran on 28/05/2021.
//

import Foundation

struct AddressGen {
    static let chars = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f"]
    static func generateAddress() -> String {
        var addr = "0x"
        for _ in 0 ..< 10 {
            let idx = Int.random(in: 0 ..< 16)
            addr += chars[idx]
        }
        return addr
    }
}
