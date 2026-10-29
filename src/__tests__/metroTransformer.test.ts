jest.mock('@expo/metro-config/babel-transformer', () => ({
  transform: jest.fn(() => 'expo'),
}))
jest.mock('react-native-svg-transformer', () => ({
  transform: jest.fn(() => 'svg'),
}))

// eslint-disable-next-line @typescript-eslint/no-var-requires
const transformer = require('../../metro.transformer')

const expoTransformer = jest.requireMock('@expo/metro-config/babel-transformer')
const svgTransformer = jest.requireMock('react-native-svg-transformer')

describe('metro transformer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('sends SVG files to the SVG transformer only', () => {
    const props = { filename: 'a/b/logo.svg', src: '<svg />' }
    expect(transformer.transform(props)).toBe('svg')
    expect(svgTransformer.transform).toHaveBeenCalledTimes(1)
    expect(svgTransformer.transform).toHaveBeenCalledWith(props)
    expect(expoTransformer.transform).not.toHaveBeenCalled()
  })

  it.each(['a/b/index.ts', 'a/b/App.tsx', 'a/b/streams.js'])(
    'sends %s to the Expo transformer only',
    (filename) => {
      const props = { filename, src: 'export {}' }
      expect(transformer.transform(props)).toBe('expo')
      expect(expoTransformer.transform).toHaveBeenCalledTimes(1)
      expect(expoTransformer.transform).toHaveBeenCalledWith(props)
      expect(svgTransformer.transform).not.toHaveBeenCalled()
    },
  )
})
