import fs from 'fs'
import path from 'path'

const PROJECT_ROOT = path.resolve(__dirname, '../..')
const MAESTRO_DIR = path.join(PROJECT_ROOT, '.maestro')

const read = (file: string) =>
  fs.readFileSync(path.join(PROJECT_ROOT, file), 'utf8')

const flowFiles = ['flows', 'subflows'].flatMap((dir) =>
  fs
    .readdirSync(path.join(MAESTRO_DIR, dir))
    .filter((name) => name.endsWith('.yaml'))
    .map((name) => path.join('.maestro', dir, name)),
)

describe('Maestro flows', () => {
  // CI runs only Android, where hideKeyboard presses Back. On iOS, Maestro
  // cannot hide the keyboard of the app's text inputs.
  it.each(flowFiles)('%s closes the keyboard without hideKeyboard', (file) => {
    expect(read(file)).not.toMatch(/^\s*-\s*hideKeyboard\b/m)
  })

  // On iOS the account list lives in the iCloud key-value store, which
  // clearState and clearKeychain leave in place. A flow that starts clean
  // goes through the subflow, which signs out of an old list in the app.
  it.each(['01-create-account.yaml', '02-import-account.yaml'])(
    '%s starts from a clean account list',
    (file) => {
      const flow = read(path.join('.maestro', 'flows', file))
      expect(flow).toMatch(/^- runFlow: \.\.\/subflows\/clean-start\.yaml$/m)
      expect(flow).not.toMatch(/clearState/)
    },
  )

  // The app opens a websocket to surfpool on 8900. Without the reverse, an
  // Android emulator shows "ws error" toasts that block taps.
  it.each(['scripts/maestro-surfpool.sh', '.github/workflows/maestro.yml'])(
    '%s reverses the surfpool websocket port for the emulator',
    (file) => {
      expect(read(file)).toMatch(/adb reverse tcp:8900 tcp:8900/)
    },
  )
})
