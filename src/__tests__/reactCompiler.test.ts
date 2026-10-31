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
// React makes the compiler leave that function as written, with no build
// error. Sibling functions in the file still compile.
const COMPILED_FILES = [
  'src/features/governance/PositionCard.tsx',
  'src/features/ledger/DeviceShow.tsx',
  'src/features/account/useTxn.tsx',
  'src/features/account/AccountsScreen.tsx',
  'src/ui/AutoGasBanner.tsx',
  'src/features/keystone/components/DynamicQrScanner.tsx',
  'src/ui/QrScanner.tsx',
  'src/features/keystone/SignTx/SignTxModal.tsx',
  'src/features/dappLogin/DappLoginScreen.tsx',
  'src/features/txnDelegation/useSolTxns.ts',
  'src/utils/i18n.tsx',
  'src/solana/WalletSignBottomSheetTransaction.tsx',
]

// Event kinds the compiler logs when it leaves a function as written.
const SKIP_EVENTS = ['CompileError', 'CompileSkip', 'PipelineError']

type CompilerEvent = { kind: string; fnLoc?: unknown; detail?: unknown }

// Only the compiler and TS syntax: the rest of the app config needs Metro.
// The logger records each function the compiler skips.
const compileAppSource = (relativePath: string, source: string) => {
  const filename = path.join(ROOT, relativePath)
  const skipped: CompilerEvent[] = []
  const code =
    transformSync(source, {
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
            logger: {
              logEvent: (_filename: string | null, event: CompilerEvent) => {
                if (SKIP_EVENTS.includes(event.kind)) skipped.push(event)
              },
            },
          },
        ],
        [
          '@babel/plugin-syntax-typescript',
          { isTSX: relativePath.endsWith('.tsx') },
        ],
      ],
    })?.code ?? ''
  return { code, skipped }
}

const compileAppFile = (relativePath: string) =>
  compileAppSource(
    relativePath,
    fs.readFileSync(path.join(ROOT, relativePath), 'utf8'),
  )

// A lint suppression makes the compiler leave the component as written.
const SUPPRESSED_COMPONENT = `
import React, { useEffect } from 'react'
import { Text } from 'react-native'

export const Ticker = ({ name, onTick }: { name: string; onTick: (n: string) => void }) => {
  useEffect(() => {
    onTick(name)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return <Text>{name}</Text>
}
`

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
  it.each(COMPILED_FILES)('compiles every function in %s', (relativePath) => {
    const { code, skipped } = compileAppFile(relativePath)
    expect(skipped).toEqual([])
    expect(code).toContain('react/compiler-runtime')
  })

  it('records a function skipped for a lint suppression', () => {
    const { skipped } = compileAppSource(
      'src/components/Ticker.tsx',
      SUPPRESSED_COMPONENT,
    )
    expect(skipped).not.toEqual([])
  })
})
