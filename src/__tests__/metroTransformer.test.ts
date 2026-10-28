import fs from 'fs'
import path from 'path'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const svgUpstream = require('metro-react-native-babel-transformer')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const metroTransformer = require('../../metro.transformer')

const ROOT = path.join(__dirname, '..', '..')
const SVG_FILE = path.join(ROOT, 'src', 'assets', 'images', 'copyAddress.svg')

describe('metro babel transformer', () => {
  // Expo's Metro config passes the Babel config as a name relative to
  // projectRoot. The SVG transformer's Babel `extends` it, and under Expo's
  // transform worker the bare name does not resolve.
  it('hands the SVG transformer an absolute Babel config path', () => {
    const transform = jest.spyOn(svgUpstream, 'transform')

    metroTransformer.transform({
      filename: SVG_FILE,
      src: fs.readFileSync(SVG_FILE, 'utf8'),
      options: {
        dev: false,
        hot: false,
        platform: 'ios',
        projectRoot: ROOT,
        extendsBabelConfigPath: 'babel.config.js',
      },
    })

    expect(transform).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          extendsBabelConfigPath: path.join(ROOT, 'babel.config.js'),
        }),
      }),
    )
  })
})
