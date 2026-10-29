jest.mock('@expo/metro-config/babel-transformer', () => ({
  transform: jest.fn(() => 'expo'),
}))
jest.mock('react-native-svg-transformer', () => ({
  transform: jest.fn(() => 'svg'),
}))

// eslint-disable-next-line @typescript-eslint/no-require-imports
const transformer = require('../../metro.transformer')

const expoTransformer = jest.requireMock('@expo/metro-config/babel-transformer')
const svgTransformer = jest.requireMock('react-native-svg-transformer')

const options = { projectRoot: '/root', extendsBabelConfigPath: undefined }

describe('metro transformer routing', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('sends SVG files to the SVG transformer only', () => {
    const props = { filename: 'a/b/logo.svg', src: '<svg />', options }
    expect(transformer.transform(props)).toBe('svg')
    expect(svgTransformer.transform).toHaveBeenCalledTimes(1)
    expect(svgTransformer.transform).toHaveBeenCalledWith(
      expect.objectContaining({ filename: props.filename, src: props.src }),
    )
    expect(expoTransformer.transform).not.toHaveBeenCalled()
  })

  it.each([
    'a/b/index.ts',
    'a/b/App.tsx',
    'a/b/streams.js',
    'node_modules/react-native-svg/lib/module/index.js',
  ])('sends %s to the Expo transformer only', (filename) => {
    const props = { filename, src: 'export {}', options }
    expect(transformer.transform(props)).toBe('expo')
    expect(expoTransformer.transform).toHaveBeenCalledTimes(1)
    expect(expoTransformer.transform).toHaveBeenCalledWith(props)
    expect(svgTransformer.transform).not.toHaveBeenCalled()
  })
})
