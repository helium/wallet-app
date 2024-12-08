import type { SkMatrix, Vector } from '@shopify/react-native-skia'
import { Skia } from '@shopify/react-native-skia'

export const scale = (matrix: SkMatrix, s: number, origin: Vector) => {
  'worklet'

  const source = Skia.Matrix(matrix.get())
  source.translate(origin.x, origin.y)
  source.scale(s, s)
  source.translate(-origin.x, -origin.y)
  return source
}

export const rotateZ = (matrix: SkMatrix, theta: number, origin: Vector) => {
  'worklet'

  const source = Skia.Matrix(matrix.get())
  source.translate(origin.x, origin.y)
  source.rotate(theta)
  source.translate(-origin.x, -origin.y)
  return source
}

export const translate = (matrix: SkMatrix, x: number, y: number) => {
  'worklet'

  const m = Skia.Matrix()
  m.translate(x, y)
  m.concat(matrix)
  return m
}

export const toM4 = (m3: SkMatrix) => {
  'worklet'

  if (!m3) {
    return [1, 1, 1, 0, 1, 1, 1, 0, 0, 0, 1, 0, 1, 1, 1, 1]
  }

  const scaleXIndex = 0
  const skewXIndex = 1
  const transXIndex = 2
  const skewYIndex = 3
  const scaleYIndex = 4
  const transYIndex = 5
  const pers0Index = 6
  const pers1Index = 7
  const pers2Index = 8

  const m = m3.get()
  const tx = m[transXIndex]
  const ty = m[transYIndex]
  const sx = m[scaleXIndex]
  const sy = m[scaleYIndex]
  const skewX = m[skewXIndex]
  const skewY = m[skewYIndex]
  const persp0 = m[pers0Index]
  const persp1 = m[pers1Index]
  const persp2 = m[pers2Index]
  return [
    sx,
    skewY,
    persp0,
    0,
    skewX,
    sy,
    persp1,
    0,
    0,
    0,
    1,
    0,
    tx,
    ty,
    persp2,
    1,
  ]
}
