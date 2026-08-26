// jest's testMatch is **/__tests__/**/*.test.ts, so this file is not a suite
import { UR, UREncoder } from '@ngraveio/bc-ur'

// Same value as src/components/StaticQrCode.tsx
export const MAX_FRAGMENT_CAPACITY = 200

// Mirrors AnimatedQrCode: the animated frames a device scans or emits
export const urToFrames = (
  ur: UR,
  fragmentCapacity = MAX_FRAGMENT_CAPACITY,
) => {
  const encoder = new UREncoder(ur, fragmentCapacity)
  const frames: string[] = []
  for (let i = 0; i < encoder.fragmentsLength; i += 1) {
    frames.push(encoder.nextPart())
  }
  return frames
}
