//
//  Jazzicon.swift
//  JazziconSwift
//
//  Created by Chung Tran on 28/05/2021.
//
import Foundation
import UIKit

public struct Jazzicon {
    // MARK: - Properties

    private var seed: UInt32

    // MARK: - Initializers

    public init(
        seed: UInt32 = .random(in: 0 ..< 10_000_000)
    ) {
        self.seed = seed
    }

    /// Generate random jazzicon
    /// - Parameter size: size of the image (width = height)
    /// - Returns: an instance of UIImage
    public func generateImage(size: CGFloat) -> UIImage {
        // create generator
        let generator = Gust(seed: seed)

        var remainingColors = hueShift(colors: jazziconColorHexes, rand: generator.randomFloat())

        var images = [UIImage]()

        // first shape (without translation, rotation)

        let firstImg = generateFirstShape(
            size: size,
            remainingColors: &remainingColors,
            generator: generator
        )
        images.append(firstImg)

        // other shapes
        let shapeCount = 4
        for i in 0 ..< shapeCount - 1 {
            let nextImg = generateOtherShape(
                size: size,
                total: shapeCount - 1,
                i: i,
                remainingColors: &remainingColors,
                generator: generator
            )
            images.append(nextImg)
        }

        UIGraphicsBeginImageContext(.init(width: size, height: size))
        let areaSize = CGRect(x: 0, y: 0, width: size, height: size)

        images.forEach { $0.draw(in: areaSize) }

        let newImage = UIGraphicsGetImageFromCurrentImageContext()!
        UIGraphicsEndImageContext()

        return newImage
    }
}

// MARK: - Helpers

private func generateFirstShape(
    size: CGFloat,
    remainingColors: inout [ColorHex],
    generator: Gust
) -> UIImage {
    // drawing
    UIGraphicsBeginImageContextWithOptions(.init(width: size, height: size), false, 0)
    let ctx = UIGraphicsGetCurrentContext()!
    ctx.saveGState()

    let rect = CGRect(x: 0, y: 0, width: size, height: size)

    ctx.setFillColor(generateColor(from: &remainingColors, generator: generator))
    ctx.fill(rect)
    ctx.restoreGState()
    let img = UIGraphicsGetImageFromCurrentImageContext()!
    UIGraphicsEndImageContext()

    return img
}

private func generateOtherShape(
    size: CGFloat,
    total: Int,
    i: Int,
    remainingColors: inout [ColorHex],
    generator: Gust
) -> UIImage {
    let firstRot: Float = generator.randomFloat()
    let angle = Float.pi * 2 * Float(firstRot)

    let f = Float(size) / Float(total) * generator.randomFloat()
    let s = (Float(i) * Float(size) / Float(total))
    let velocity = f + s

    // 1
    let tx = cos(angle) * velocity
    let ty = sin(angle) * velocity

    // Third random is a shape rotation on top of all of that.
    let secondRot: Float = generator.randomFloat()

    let rot = (firstRot * 360) + (secondRot * 180)

    // drawing
    UIGraphicsBeginImageContextWithOptions(.init(width: size, height: size), false, 0)
    let ctx = UIGraphicsGetCurrentContext()!
    ctx.saveGState()

    let fill = generateColor(from: &remainingColors, generator: generator)
    ctx.setFillColor(fill)

    ctx.translateBy(x: CGFloat(tx), y: CGFloat(ty))

    ctx.translateBy(x: CGFloat(size / 2), y: CGFloat(size / 2))
    ctx.rotate(by: CGFloat(rot) * CGFloat(Double.pi / 180))

    // Move
    let rect = CGRect(x: -size / 2, y: -size / 2, width: size, height: size)
    ctx.fill(rect)
//
    ctx.restoreGState()
    let img = UIGraphicsGetImageFromCurrentImageContext()!
    UIGraphicsEndImageContext()

    return img
}

private func generateColor(
    from remainingColors: inout [ColorHex],
    generator: Gust
) -> CGColor {
    // Temp bug fix to get correct numbers generated
    generator.randomFloat()
    let r = generator.randomFloat()
    let idx = floor(Float(remainingColors.count) * r)
    let colorHex = remainingColors[Int(idx)]
    remainingColors.removeAll(where: { $0 == colorHex })
    return UIColor(hex: colorHex)?.cgColor ?? UIColor.white.cgColor
}

func hueShift(
    colors: [ColorHex],
    rand: Float
) -> [ColorHex] {
    let wobble: Float = 30
    let rand: Float = rand
    let amount = (rand * 30.0) - (wobble / 2)
    return colors.map { rotateColor($0, degrees: Float(amount)) }
}

extension Gust {
    func randomFloat() -> Float {
        let uint32: UInt32 = random()
        return Float(uint32) * (1.0 / 4_294_967_296.0)
    }
}
