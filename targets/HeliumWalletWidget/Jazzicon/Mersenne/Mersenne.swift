/*

 Kai Wells, http://kaiwells.me

 */

/// Multiply two `UInt32`'s and discard the overflow.
///
private func discardMultiply(_ a: UInt32, _ b: UInt32) -> UInt32 {
    let ah = UInt64(a & 0xFFFF_0000) >> 16
    let al = UInt64(a & 0x0000_FFFF)
    let bh = UInt64(b & 0xFFFF_0000) >> 16
    let bl = UInt64(b & 0x0000_FFFF)

    // Most significant bits overflow anyways, so don't bother
    // let F  = ah * bh
    let OI = ah * bl + al * bh
    let L = al * bl

    let result = (((OI << 16) & 0xFFFF_FFFF) + L) & 0xFFFF_FFFF
    return UInt32(result)
}

/// Generates pseudo-random `UInt32`'s.
///
/// Uses the Mersenne Twister PRNG algorithm described [here](https://en.wikipedia.org/wiki/Mersenne_Twister).
///
internal final class MersenneTwisterGenerator: IteratorProtocol {
    internal typealias Element = UInt32

    // Magic numbers
    private let (w, n, m, r): (UInt32, Int, Int, UInt32) = (32, 624, 397, 31)
    private let a: UInt32 = 0x9908_B0DF
    private let (u, d): (UInt32, UInt32) = (11, 0xFFFF_FFFF)
    private let (s, b): (UInt32, UInt32) = (7, 0x9D2C_5680)
    private let (t, c): (UInt32, UInt32) = (15, 0xEFC6_0000)
    private let l: UInt32 = 18
    private let f: UInt32 = 1_812_433_253

    /// The maximum value an `UInt32` may take.
    ///
    internal let maxValue: UInt32 = 4_294_967_295

    private var state: [UInt32]
    private var index = 0

    /// Initialize the internal state of the generator.
    ///
    /// - parameter seed: The value used to generate the intial state. Should be chosen at random.
    init(seed: UInt32 = 5489) {
        var x = [seed]
        for i in 1 ..< n {
            let prev = x[i - 1]
            let c = discardMultiply(f, prev ^ (prev >> (w - 2)))
            let (next, _) = c.addingReportingOverflow(UInt32(i))
            x.append(next)
        }
        state = x

        index = n
    }

    /// Puts the twist in Mersenne Twister.
    ///
    private func twist(y: inout UInt32) {
//        for i in 0..<n {
//            let x = (state[i] & 0xFFFF0000) + ((state[(i+1) % n] % UInt32(n)) & 0x0000FFFF)
//            var xA = x >> 1
//            if (x % 2 != 0) {
//                xA = xA ^ a
//            }
//            state[i] = state[(i + m) % n] ^ xA
//            index = 0
//        }

        let UPPER_MASK: UInt32 = 0x8000_0000
        let LOWER_MASK: UInt32 = 0x7FFF_FFFF
        let MATRIX_A: UInt32 = 0x9908_B0DF
        let mag01 = [0x0, MATRIX_A]

        if index >= n { /* generate N words at one time */
            var kk = 0

            repeat {
                y = (state[kk] & UPPER_MASK) | (state[kk + 1] & LOWER_MASK)
                state[kk] = state[kk + m] ^ (y >> 1) ^ UInt32(mag01[Int(y) & 0x1])

                kk += 1
            } while kk < n - m

            repeat {
                y = (state[kk] & UPPER_MASK) | (state[kk + 1] & LOWER_MASK)
                state[kk] = state[kk + (m - n)] ^ (y >> 1) ^ UInt32(mag01[Int(y) & 0x1])

                kk += 1
            } while kk < n - 1

            y = (state[n - 1] & UPPER_MASK) | (state[0] & LOWER_MASK)
            state[n - 1] = state[n - 1] ^ (y >> 1) ^ UInt32(mag01[Int(y) & 0x1])

            index = 0
        }
    }

    /// Provides the next `UInt32` in the sequence.
    ///
    /// Also modifies the internal state state array, twisting if necessary.
    /// Required by the GeneratorType protocol.
    ///
    internal func next() -> UInt32? {
        var y: UInt32 = 0
        if index >= n { twist(y: &y) }

        y = state[index]
        y = y ^ ((y >> u) & d)
        y = y ^ ((y << s) & b)
        y = y ^ ((y << t) & c)
        y = y ^ (y >> l)

        index += 1
        return y
    }
}
