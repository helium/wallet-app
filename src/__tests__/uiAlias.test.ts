import path from 'path'
import { transformSync } from '@babel/core'

const ROOT = path.join(__dirname, '..', '..')

describe('@ui alias in the app Babel config', () => {
  it('resolves @ui to src/ui', () => {
    const code =
      transformSync("export { Text } from '@ui/Text'", {
        cwd: ROOT,
        root: ROOT,
        filename: path.join(ROOT, 'src/features/home/HomeScreen.tsx'),
        configFile: path.join(ROOT, 'babel.config.js'),
        babelrc: false,
      })?.code ?? ''

    expect(code).toContain('"../../ui/Text"')
  })
})
