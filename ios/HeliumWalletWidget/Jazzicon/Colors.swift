//
//  Colors.swift
//  JazziconSwift
//
//  Created by Chung Tran on 28/05/2021.
//

import Foundation
import UIKit

// MARK: - Internal

typealias ColorHex = String

extension UIColor {
    convenience init?(hex: ColorHex) {
        var cString: String = hex.trimmingCharacters(in: .whitespacesAndNewlines).uppercased()

        if cString.hasPrefix("#") {
            cString.remove(at: cString.startIndex)
        }

        var rgbValue: UInt64 = 0
        Scanner(string: cString).scanHexInt64(&rgbValue)

        self.init(
            red: CGFloat((rgbValue & 0xFF0000) >> 16) / 255.0,
            green: CGFloat((rgbValue & 0x00FF00) >> 8) / 255.0,
            blue: CGFloat(rgbValue & 0x0000FF) / 255.0,
            alpha: CGFloat(1.0)
        )
    }
}

var jazziconColorHexes: [ColorHex] {
    [
        "#01888C", // teal
        "#FC7500", // bright orange
        "#034F5D", // dark teal
        "#F73F01", // orangered
        "#FC1960", // magenta
        "#C7144C", // raspberry
        "#F3C100", // goldenrod
        "#1598F2", // lightning blue
        "#2465E1", // sail blue
        "#F19E02", // gold
    ]
}

func rotateColor(_ hex: ColorHex, degrees: Float) -> ColorHex {
    var hsl = hexToHSL(hex)
    hsl.h = (hsl.h + degrees).truncatingRemainder(dividingBy: 360)
    hsl.h = hsl.h < 0 ? 360 + hsl.h : hsl.h
    return hslToHex(hsl)
}

// MARK: - Private

struct HSL: Equatable {
    var h: Float
    let s: Float
    let l: Float
}

func hexToHSL(_ hex: ColorHex) -> HSL {
    // Convert hex to RGB first
    var r = Float(Int(hex[1] + hex[2], radix: 16)!)
    var g = Float(Int(hex[3] + hex[4], radix: 16)!)
    var b = Float(Int(hex[5] + hex[6], radix: 16)!)

    // Then to HSL
    r /= 255.0
    g /= 255.0
    b /= 255.0

    let cmin = Swift.min(r, g, b)
    let cmax = Swift.max(r, g, b)
    let delta = cmax - cmin

    var h: Float = 0
    var s: Float = 0
    var l: Float = 0

    if delta == 0 {
        h = 0
    } else if cmax == r {
        h = ((g - b) / delta).truncatingRemainder(dividingBy: 6)
    } else if cmax == g {
        h = (b - r) / delta + 2
    } else {
        h = (r - g) / delta + 4
    }

    h = round(h * 60)

    if h < 0 {
        h += 360
    }

    l = (cmax + cmin) / 2
    s = delta == 0 ? 0 : delta / (1 - abs(2 * l - 1))
    s = +(s * 100).toFixed(0)
    l = +(l * 100).toFixed(0)

    return .init(h: h, s: s, l: l)
}

private func hslToHex(_ hsl: HSL) -> ColorHex {
    let h = hsl.h
    var s = hsl.s
    var l = hsl.l

    s /= 100
    l /= 100

    let c = (1 - abs(2 * l - 1)) * s
    let x = c * (1 - abs((h / 60).truncatingRemainder(dividingBy: 2) - 1))
    let m = l - c / 2
    var r: Float = 0.0
    var g: Float = 0.0
    var b: Float = 0.0

    if h >= 0, h < 60 {
        r = c; g = x; b = 0
    } else if h >= 60, h < 120 {
        r = x; g = c; b = 0
    } else if h >= 120, h < 180 {
        r = 0; g = c; b = x
    } else if h >= 180, h < 240 {
        r = 0; g = x; b = c
    } else if h >= 240, h < 300 {
        r = x; g = 0; b = c
    } else if h >= 300, h < 360 {
        r = c; g = 0; b = x
    }

    // Having obtained RGB, convert channels to hex
    var rStr = ((r + m) * 255).toBase16()
    var gStr = ((g + m) * 255).toBase16()
    var bStr = ((b + m) * 255).toBase16()

    // Prepend 0s, if necessary
    if rStr.count == 1 {
        rStr = "0" + rStr
    }

    if gStr.count == 1 {
        gStr = "0" + gStr
    }

    if bStr.count == 1 {
        bStr = "0" + bStr
    }

    return "#" + rStr + gStr + bStr
}

private extension Float {
    func toBase16() -> String {
        String(Int(rounded()), radix: 16, uppercase: true)
    }
}

private extension String {
    var length: Int {
        return count
    }

    subscript(i: Int) -> String {
        return self[i ..< i + 1]
    }

    func substring(fromIndex: Int) -> String {
        return self[min(fromIndex, length) ..< length]
    }

    func substring(toIndex: Int) -> String {
        return self[0 ..< max(0, toIndex)]
    }

    subscript(r: Range<Int>) -> String {
        let range = Range(uncheckedBounds: (lower: max(0, min(length, r.lowerBound)),
                                            upper: min(length, max(0, r.upperBound))))
        let start = index(startIndex, offsetBy: range.lowerBound)
        let end = index(start, offsetBy: range.upperBound - range.lowerBound)
        return String(self[start ..< end])
    }
}

extension Float {
    /// Rounds the float to decimal places value
    func toFixed(_ places: Int) -> Float {
        let divisor = pow(10.0, Float(places))
        return (self * divisor).rounded() / divisor
    }
}
