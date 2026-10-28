/* eslint-disable no-bitwise */
// Port of react-native-jazzicon 0.1.2 (MIT), which in turn ports MetaMask's
// jazzicon. The output matches the library, so account icons keep their look.

const BASE_COLORS = [
  '#01888C',
  '#FC7500',
  '#034F5D',
  '#F73F01',
  '#FC1960',
  '#C7144C',
  '#F3C100',
  '#1598F2',
  '#2465E1',
  '#F19E02',
]
const WOBBLE = 30
const SHAPE_COUNT = 3

// MT19937, as in the mersenne-twister 1.1.0 package: random() is
// genrand_int32 / 2^32.
const N = 624
const M = 397
const mersenneTwister = (seed: number) => {
  const mt = new Array<number>(N)
  mt[0] = seed >>> 0
  for (let i = 1; i < N; i += 1) {
    const s = mt[i - 1] ^ (mt[i - 1] >>> 30)
    mt[i] =
      (((((s & 0xffff0000) >>> 16) * 1812433253) << 16) +
        (s & 0x0000ffff) * 1812433253 +
        i) >>>
      0
  }
  let mti = N

  const twist = (kk: number, next: number, far: number) => {
    const y = (mt[kk] & 0x80000000) | (mt[next] & 0x7fffffff)
    mt[kk] = mt[far] ^ (y >>> 1) ^ (y & 1 ? 0x9908b0df : 0)
  }

  return () => {
    if (mti >= N) {
      for (let kk = 0; kk < N; kk += 1) {
        twist(kk, (kk + 1) % N, (kk + M) % N)
      }
      mti = 0
    }
    let y = mt[mti]
    mti += 1
    y ^= y >>> 11
    y ^= (y << 7) & 0x9d2c5680
    y ^= (y << 15) & 0xefc60000
    y ^= y >>> 18
    return (y >>> 0) * (1 / 4294967296)
  }
}

// Hue rotation with the same float math and rounding as color 3.2.1.
const rotateHue = (hex: string, degrees: number) => {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const min = Math.min(r, g, b)
  const max = Math.max(r, g, b)
  const delta = max - min
  let h = 0
  if (max === min) h = 0
  else if (r === max) h = (g - b) / delta
  else if (g === max) h = 2 + (b - r) / delta
  else h = 4 + (r - g) / delta
  h = Math.min(h * 60, 360)
  if (h < 0) h += 360
  const l = (min + max) / 2
  let s = 0
  if (max !== min) s = l <= 0.5 ? delta / (max + min) : delta / (2 - max - min)

  h = (h + degrees) % 360
  if (h < 0) h += 360

  const hue = h / 360
  const t2 = l < 0.5 ? l * (1 + s) : l + s - l * s
  const t1 = 2 * l - t2
  const channel = (offset: number) => {
    if (s === 0) return l * 255
    let t3 = hue + offset
    if (t3 < 0) t3 += 1
    if (t3 > 1) t3 -= 1
    if (6 * t3 < 1) return (t1 + (t2 - t1) * 6 * t3) * 255
    if (2 * t3 < 1) return t2 * 255
    if (3 * t3 < 2) return (t1 + (t2 - t1) * (2 / 3 - t3) * 6) * 255
    return t1 * 255
  }
  return `#${[1 / 3, 0, -1 / 3]
    .map((offset) =>
      Number(channel(offset).toFixed(0))
        .toString(16)
        .toUpperCase()
        .padStart(2, '0'),
    )
    .join('')}`
}

export type JazziconShape = { fill: string; transform: string }
export type Jazzicon = { background: string; shapes: JazziconShape[] }

export const jazzicon = (seed: number, size: number): Jazzicon => {
  const random = mersenneTwister(seed)
  const amount = random() * 30 - WOBBLE / 2
  const colors = BASE_COLORS.map((hex) => rotateHue(hex, amount))
  const takeColor = () => {
    random()
    return colors.splice(Math.floor(colors.length * random()), 1)[0]
  }

  const background = takeColor()
  const center = size / 2
  const shapes = Array.from({ length: SHAPE_COUNT }, (_, index) => {
    const firstRot = random()
    const angle = Math.PI * 2 * firstRot
    const velocity =
      (size / SHAPE_COUNT) * random() + (index * size) / SHAPE_COUNT
    const tx = Math.cos(angle) * velocity
    const ty = Math.sin(angle) * velocity
    const secondRot = random()
    const rot = firstRot * 360 + secondRot * 180
    return {
      fill: takeColor(),
      transform: `translate(${tx} ${ty}) rotate(${rot.toFixed(
        1,
      )} ${center} ${center})`,
    }
  })
  return { background, shapes }
}
