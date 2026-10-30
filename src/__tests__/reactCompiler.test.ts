import fs from 'fs'
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

// Files the compiler once skipped. A lint suppression or a broken Rule of
// React makes the compiler leave a file as written, with no error.
const COMPILED_FILES = [
  'src/features/governance/PositionCard.tsx',
  'src/features/ledger/DeviceShow.tsx',
  'src/features/account/useTxn.tsx',
  'src/features/account/AccountsScreen.tsx',
  'src/components/AutoGasBanner.tsx',
  'src/components/DynamicQrScanner.tsx',
  'src/components/QrScanner.tsx',
  'src/features/keystone/SignTx/SignTxModal.tsx',
  'src/features/dappLogin/DappLoginScreen.tsx',
  'src/features/txnDelegation/useSolTxns.ts',
  'src/utils/i18n.tsx',
]

// Only the compiler and TS syntax: the rest of the app config needs Metro.
const compileAppFile = (relativePath: string) => {
  const filename = path.join(ROOT, relativePath)
  return (
    transformSync(fs.readFileSync(filename, 'utf8'), {
      cwd: ROOT,
      filename,
      babelrc: false,
      configFile: false,
      plugins: [
        [
          'babel-plugin-react-compiler',
          {
            panicThreshold: 'none',
            sources: [path.join(ROOT, 'src') + path.sep],
          },
        ],
        [
          '@babel/plugin-syntax-typescript',
          { isTSX: relativePath.endsWith('.tsx') },
        ],
      ],
    })?.code ?? ''
  )
}

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

describe('React Compiler on app files', () => {
  it.each(COMPILED_FILES)('compiles %s', (relativePath) => {
    expect(compileAppFile(relativePath)).toContain('react/compiler-runtime')
  })
})
