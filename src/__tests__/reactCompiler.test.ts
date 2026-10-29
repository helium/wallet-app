import path from 'path'
import { transformSync } from '@babel/core'

const ROOT = path.join(__dirname, '..', '..')

const COMPONENT = `
import React from 'react'
import { Text } from 'react-native'

export const Greeting = ({ name }: { name: string }) => {
  const label = \`Hello \${name}\`
  return <Text>{label}</Text>
}
`

// Babel with the app's own config, as Metro runs it.
const transformAppCode = (relativePath: string, code: string) =>
  transformSync(code, {
    cwd: ROOT,
    root: ROOT,
    filename: path.join(ROOT, relativePath),
    configFile: path.join(ROOT, 'babel.config.js'),
    babelrc: false,
  })?.code ?? ''

describe('React Compiler in the app Babel config', () => {
  it('memoizes components under src/', () => {
    expect(
      transformAppCode('src/components/Greeting.tsx', COMPONENT),
    ).toContain('react/compiler-runtime')
  })

  it('leaves code outside src/ as written', () => {
    expect(transformAppCode('Greeting.tsx', COMPONENT)).not.toContain(
      'react/compiler-runtime',
    )
  })
})
