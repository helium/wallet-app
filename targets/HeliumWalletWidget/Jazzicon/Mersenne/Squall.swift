/*

 Kai Wells, http://kaiwells.me

 */

import Foundation

// DispatchQueue not avaliable on linux
#if os(macOS)

    /// Provides a wrapper around a Mersenne Twister implementation.
    ///
    /// Remember to seed with some value.
    ///
    /// Squall is thread-safe, but cannot produce values in parallel.
    /// If parallelism is desired, consider using a Gust instance (with some offset value) per thread.
    public enum Squall {
        fileprivate static var generator = MersenneTwisterGenerator()
        fileprivate static var queue = DispatchQueue(label: "me.kaiwells.Squall")

        /// Initialize the internal state of the generator.
        ///
        /// - parameter seed: The value used to generate the intial state. Should be chosen at random.
        public static func seed(_ seed: UInt32) {
            Squall.queue.sync {
                Squall.generator = MersenneTwisterGenerator(seed: seed)
            }
        }

        /// Initialize the internal state of the generator.
        ///
        /// Uses the current time as the seed. Should not overflow until February 2106.
        ///
        /// Caution when spawning multiple processes within close temporal proximity.
        public static func seed() {
            Squall.queue.sync {
                let seed = SeedForTime()
                Squall.generator = MersenneTwisterGenerator(seed: seed)
            }
        }

        /// Prevents deadlocks
        fileprivate static func _random() -> UInt32 {
            return generator.next()!
        }

        /// Generates a random `UInt32`.
        ///
        /// - returns: The next `UInt32` in the sequence
        public static func random() -> UInt32 {
            var result: UInt32 = 0
            Squall.queue.sync {
                result = Squall._random()
            }
            return result
        }

        /// Prevents deadlocks
        fileprivate static func _random() -> UInt64 {
            return ConcatUInt32(generator.next()!, generator.next()!)
        }

        /// Generates a random `UInt64`.
        ///
        /// - returns: The next `UInt64` in the sequence
        public static func random() -> UInt64 {
            var result: UInt64 = 0
            Squall.queue.sync {
                result = Squall._random()
            }
            return result
        }

        /// Prevents deadlocks
        fileprivate static func _uniform(_ lower: Double = 0, _ upper: Double = 1) -> Double {
            let f = Double(Squall._random() as UInt64) / Double(UInt64.max)
            return Uniform(lower: lower, upper: upper, ratio: f)
        }

        /// Pull from a uniform distribution of random numbers. Defaults to [0, 1).
        ///
        /// - parameter lower: Lower bound of uniform distribution. Defaults to 0.
        ///
        /// - parameter upper: Upper bound of uniform distribution. Defaults to 1.
        ///
        /// - returns: A pseudo-random number from the range [lower, upper).
        public static func uniform(_ lower: Double = 0, _ upper: Double = 1) -> Double {
            var result: Double = 0
            Squall.queue.sync {
                result = Squall._uniform(lower, upper)
            }
            return result
        }

        /// Prevents deadlocks
        fileprivate static func _uniform(_ lower: Float = 0, _ upper: Float = 1) -> Float {
            let f = Float(Squall._random() as UInt32) / Float(UInt32.max)
            return Uniform(lower: lower, upper: upper, ratio: f)
        }

        /// Pull from a uniform distribution of random numbers. Defaults to [0, 1).
        ///
        /// - parameter lower: Lower bound of uniform distribution. Defaults to 0.
        ///
        /// - parameter upper: Upper bound of uniform distribution. Defaults to 1.
        ///
        /// - returns: A pseudo-random number from the range [lower, upper).
        public static func uniform(_ lower: Float = 0, _ upper: Float = 1) -> Float {
            var result: Float = 0
            Squall.queue.sync {
                result = Squall._uniform(lower, upper)
            }
            return result
        }

        /// Pull from a Gaussian distribution of random numbers.
        ///
        /// - parameter average: The center of the distribution. Defaults to 0.
        ///
        /// - parameter sigma: The standard deviation of the distribution. Defaults to 1.
        ///
        /// - returns: A pseudo-random number from a Gaussian distribution.
        public static func gaussian(average mu: Double = 0, sigma: Double = 1) -> Double {
            var result: Double = 0
            Squall.queue.sync {
                let A = Squall._uniform() as Double
                let B = Squall._uniform() as Double
                result = Gaussian(mu: mu, sigma: sigma, A: A, B: B)
            }
            return result
        }

        /// Pull from a Gaussian distribution of random numbers.
        ///
        /// - parameter average: The center of the distribution. Defaults to 0.
        ///
        /// - parameter sigma: The standard deviation of the distribution. Defaults to 1.
        ///
        /// - returns: A pseudo-random number from a Gaussian distribution.
        public static func gaussian(average mu: Float = 0, sigma: Float = 1) -> Float {
            var result: Float = 0
            Squall.queue.sync {
                let A = Squall._uniform() as Float
                let B = Squall._uniform() as Float
                result = Gaussian(mu: mu, sigma: sigma, A: A, B: B)
            }
            return result
        }
    }

#endif

/// Provides a wrapper around a Mersenne Twister implementation.
///
/// Remember to seed with some value.
///
/// NOTE: Not thread-safe! Spawn a new instance for each thread.
/// Include some seed offset if they are instantiated within close temporal proximity.
public final class Gust {
    fileprivate var generator: MersenneTwisterGenerator

    /// Initialize the internal state of the generator.
    ///
    /// - parameter seed: The value used to generate the intial state. Should be chosen at random.
    public init(seed: UInt32) {
        generator = MersenneTwisterGenerator(seed: seed)
    }

    /// Initialize the internal state of the generator.
    ///
    /// Uses the current time as the seed. Should not overflow until February 2106.
    ///
    /// Change offset when spawning multiple processes within close temporal proximity.
    public init(offset: UInt32 = 0) {
        let (seed, _) = offset.addingReportingOverflow(SeedForTime())
        generator = MersenneTwisterGenerator(seed: seed)
    }

    /// Generates a random `UInt32`.
    ///
    /// - returns: The next `UInt32` in the sequence
    public func random() -> UInt32 {
        return generator.next()!
    }

    /// Generates a random `UInt64`.
    ///
    /// - returns: The next two `UInt32`'s in the sequence concatenated bitwise
    public func random() -> UInt64 {
        return ConcatUInt32(generator.next()!, generator.next()!)
    }

    /// Pull from a uniform distribution of random numbers. Defaults to [0, 1).
    ///
    /// - parameter lower: Lower bound of uniform distribution. Defaults to 0.
    ///
    /// - parameter upper: Upper bound of uniform distribution. Defaults to 1.
    ///
    /// - returns: A pseudo-random number from the range [lower, upper).
    public func uniform(lower: Double = 0, _ upper: Double = 1) -> Double {
        let f = Double(random() as UInt64) / Double(UInt64.max)
        return Uniform(lower: lower, upper: upper, ratio: f)
    }

    /// Pull from a uniform distribution of random numbers. Defaults to [0, 1).
    ///
    /// - parameter lower: Lower bound of uniform distribution. Defaults to 0.
    ///
    /// - parameter upper: Upper bound of uniform distribution. Defaults to 1.
    ///
    /// - returns: A pseudo-random number from the range [lower, upper).
    public func uniform(lower: Float = 0, _ upper: Float = 1) -> Float {
        let f = Float(random() as UInt32) / Float(UInt32.max)
        return Uniform(lower: lower, upper: upper, ratio: f)
    }

    /// Pull from a Gaussian distribution of random numbers.
    ///
    /// - parameter average: The center of the distribution. Defaults to 0.
    ///
    /// - parameter sigma: The standard deviation of the distribution. Defaults to 1.
    ///
    /// - returns: A pseudo-random number from a Gaussian distribution.
    public func gaussian(average mu: Double = 0, sigma: Double = 1) -> Double {
        let A = uniform() as Double
        let B = uniform() as Double
        return Gaussian(mu: mu, sigma: sigma, A: A, B: B)
    }

    /// Pull from a Gaussian distribution of random numbers.
    ///
    /// - parameter average: The center of the distribution. Defaults to 0.
    ///
    /// - parameter sigma: The standard deviation of the distribution. Defaults to 1.
    ///
    /// - returns: A pseudo-random number from a Gaussian distribution.
    public func gaussian(average mu: Float = 0, sigma: Float = 1) -> Float {
        let A = uniform() as Float
        let B = uniform() as Float
        return Gaussian(mu: mu, sigma: sigma, A: A, B: B)
    }
}

extension Gust: RandomNumberGenerator {
    /// Generates a random `UInt64`.
    /// Conforms `Gust` to `RandomNumberGenerator`.
    ///
    /// - returns: The next two `UInt32`'s in the sequence concatenated bitwise
    public func next() -> UInt64 {
        return random()
    }
}

// MARK: Shared Utilities

private func SeedForTime() -> UInt32 {
    let epochTime = abs(Date().timeIntervalSince1970)
    return UInt32(epochTime)
}

private func ConcatUInt32(_ a: UInt32, _ b: UInt32) -> UInt64 {
    let hi = UInt64(a) << 32
    let lo = UInt64(b)
    return hi | lo
}

private func Uniform<T: FloatingPoint>(lower: T, upper: T, ratio: T) -> T {
    let difference = upper - lower
    return ratio * difference + lower
}

private func Gaussian(mu: Double, sigma: Double, A: Double, B: Double) -> Double {
    let X = sqrt(-2 * log(A)) * cos(2 * Double.pi * B)
    return X * sigma + mu
}

private func Gaussian(mu: Float, sigma: Float, A: Float, B: Float) -> Float {
    let X = sqrt(-2 * log(A)) * cos(2 * Float.pi * B)
    return X * sigma + mu
}
