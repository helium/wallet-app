import fs from 'fs'
import path from 'path'

const PROJECT_ROOT = path.resolve(__dirname, '../..')

// @helium/react-native-sdk loads chain vars from the retired api.helium.io
// when it is imported. patches/@helium+react-native-sdk+4.0.4.patch handles
// the rejection, so launch logs no "Uncaught (in promise): Error: Network Error".
const HTTP_CLIENT_FILES = [
  'node_modules/@helium/react-native-sdk/src/utils/httpClient.ts',
  'node_modules/@helium/react-native-sdk/lib/module/utils/httpClient.js',
  'node_modules/@helium/react-native-sdk/lib/commonjs/utils/httpClient.js',
]

describe('Helium SDK chain vars', () => {
  it.each(HTTP_CLIENT_FILES)('handles a failed vars request in %s', (file) => {
    const source = fs.readFileSync(path.join(PROJECT_ROOT, file), 'utf8')
    expect(source).toContain('configChainVars().catch(')
  })
})
