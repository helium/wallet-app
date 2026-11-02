import { AnchorProvider } from '@anchor-lang/core'
import { removeOnLogsListener } from '../solanaUtils'

// Jest does not resolve the app's import aliases
jest.mock('@hooks/useMetaplexMetadata', () => ({}), { virtual: true })
jest.mock('@utils/priorityFees', () => ({}), { virtual: true })
jest.mock('@utils/config', () => ({}), { virtual: true })
jest.mock('@utils/logger', () => ({}), { virtual: true })
// Native modules that do not load in jest
jest.mock('bcrypt-react-native', () => ({}))
jest.mock('../i18n', () => ({}))

it('removes the logs listener by its id and leaves account listeners alone', async () => {
  const connection = {
    removeOnLogsListener: jest.fn(async () => {}),
    removeAccountChangeListener: jest.fn(async () => {}),
  }
  const anchorProvider = { connection } as unknown as AnchorProvider

  await removeOnLogsListener(anchorProvider, 7)

  expect(connection.removeOnLogsListener).toHaveBeenCalledWith(7)
  expect(connection.removeAccountChangeListener).not.toHaveBeenCalled()
})
