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

  // A cold debug launch on the Android emulator takes about 90 s.
  it('clean-start waits at least 120 s for the first screen', () => {
    const flow = read('.maestro/subflows/clean-start.yaml')
    const match = flow.match(
      /^- extendedWaitUntil:\n {4}visible:\n {6}id: CreateImport\\\.Create\|AccountsTopNav\\\.Settings\n {4}timeout: (\d+)$/m,
    )
    expect(match).not.toBeNull()
    expect(Number(match?.[1])).toBeGreaterThanOrEqual(120000)
  })

  // Key generation takes about 53 s on an Android release build.
  it('create-words waits at least 90 s for the first word', () => {
    const flow = read('.maestro/subflows/create-words.yaml')
    const match = flow.match(
      /^- extendedWaitUntil:\n {4}visible:\n {6}id: RevealWords\.Word\.0\n {4}timeout: (\d+)$/m,
    )
    expect(match).not.toBeNull()
    expect(Number(match?.[1])).toBeGreaterThanOrEqual(90000)
  })

  // On an Android release build, one tap on Maybe later can leave the card
  // open. The tap repeats while the card shows, and a card that never shows
  // skips the loop.
  it('close-migrate-card taps Maybe later again while the card shows', () => {
    const flow = read('.maestro/subflows/close-migrate-card.yaml')
    expect(flow).toMatch(
      /^- repeat:\n {4}times: \d+\n {4}while:\n {6}visible:\n {8}id: MigrateToWorld\.NotNow\n {4}commands:\n[\s\S]*?- tapOn:\n {10}id: MigrateToWorld\.NotNow\n/m,
    )
    expect(flow).toMatch(
      /^- extendedWaitUntil:\n {4}notVisible:\n {6}id: MigrateToWorld\.NotNow\n {4}timeout: \d+\n$/m,
    )
  })

  // The app opens a websocket to surfpool on 8900. Without the reverse, an
  // Android emulator shows "ws error" toasts that block taps.
  it.each(['scripts/maestro-surfpool.sh', '.github/workflows/maestro.yml'])(
    '%s reverses the surfpool websocket port for the emulator',
    (file) => {
      expect(read(file)).toMatch(/adb reverse tcp:8900 tcp:8900/)
    },
  )
})
