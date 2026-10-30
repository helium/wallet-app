import React from 'react'
import { act, create, ReactTestRenderer } from 'react-test-renderer'
import { environmentManager } from '@tanstack/react-query'
import NotificationStorageProvider, {
  useNotificationStorage,
} from '../NotificationStorageProvider'
import { getNotifications, postNotificationRead } from '../../utils/walletApiV2'
import { queryClient } from '../../utils/queryClient'

type MockAccount = { address: string; solanaAddress: string }

// Real Helium/Solana address pairs, so heliumAddressToSolAddress resolves the
// current account's list to its Solana address.
const currentAccount: MockAccount = {
  address: '14A9dTmrs8KPTGq8Sc4F9VEgDKKCCoBMYPXdxNPye9DTKEJvd6g',
  solanaAddress: 'Bm2vA8wWNmYGUTK3oAXZG8eAWmzwYMfCWm3hwzpEnFd4',
}
const otherAccount: MockAccount = {
  address: '12zmaz84LWb5zTUkWSCRGMXRRPUypisLygqcUWQgkfES4xUPB7M',
  solanaAddress: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
}

let mockAccountStorage: {
  currentAccount?: MockAccount
  sortedAccounts: MockAccount[]
}

jest.mock('../AccountStorageProvider', () => ({
  useAccountStorage: () => mockAccountStorage,
}))
jest.mock('../../utils/walletApiV2', () => ({
  getNotifications: jest.fn(),
  postNotificationRead: jest.fn(),
}))

const mockGetNotifications = getNotifications as jest.Mock
const mockPostNotificationRead = postNotificationRead as jest.Mock

const FIVE_MINUTES_MS = 5 * 60_000

const notificationFor = (resource: string, id: number) => ({
  id,
  resource,
  title: `title ${id}`,
  body: '',
  createdAt: '2026-01-01T00:00:00.000Z',
  viewedAt: null,
})

const fetchedResources = () =>
  mockGetNotifications.mock.calls.map(([{ resource }]) => resource)

let storage: ReturnType<typeof useNotificationStorage>
let renderer: ReactTestRenderer | undefined

const Capture = () => {
  storage = useNotificationStorage()
  return null
}

const flush = async () => {
  await act(async () => {
    await jest.advanceTimersByTimeAsync(10)
  })
}

const renderProvider = async () => {
  await act(async () => {
    renderer = create(
      React.createElement(
        NotificationStorageProvider,
        null,
        React.createElement(Capture),
      ),
    )
  })
  await flush()
}

beforeAll(() => {
  ;(
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true
  // Jest's node environment has no window, so TanStack treats it as a server
  // and never schedules refetchInterval. The app runs as a client.
  environmentManager.setIsServer(() => false)
})

beforeEach(() => {
  jest.useFakeTimers()
  mockGetNotifications.mockReset()
  mockPostNotificationRead.mockReset()
  mockGetNotifications.mockImplementation(({ resource }) =>
    Promise.resolve([notificationFor(resource, 1)]),
  )
  mockAccountStorage = {
    currentAccount,
    sortedAccounts: [currentAccount, otherAccount],
  }
})

afterEach(async () => {
  act(() => renderer?.unmount())
  renderer = undefined
  queryClient.clear()
  // Cancelled fetches settle on later microtasks and schedule gc timers; drop
  // them under fake timers so no real 5-minute timer keeps Jest alive.
  await jest.advanceTimersByTimeAsync(0)
  jest.clearAllTimers()
  jest.useRealTimers()
})

describe('NotificationStorageProvider', () => {
  it('fetches the current resources for the current wallet and keys only resolved data', async () => {
    mockGetNotifications.mockImplementation(({ resource }) =>
      resource === 'helium-update'
        ? Promise.reject(new Error('helium-update unavailable'))
        : Promise.resolve([notificationFor(resource, 1)]),
    )

    await renderProvider()

    expect(mockGetNotifications.mock.calls.map(([args]) => args)).toEqual(
      expect.arrayContaining([
        { resource: 'wallet-update', wallet: currentAccount.solanaAddress },
        { resource: 'helium-update', wallet: currentAccount.solanaAddress },
        {
          resource: currentAccount.solanaAddress,
          wallet: currentAccount.solanaAddress,
        },
      ]),
    )
    expect(storage.notificationsByResource).not.toHaveProperty('helium-update')
    expect(storage.notificationsByResource).toEqual({
      'wallet-update': [notificationFor('wallet-update', 1)],
      [currentAccount.solanaAddress]: [
        notificationFor(currentAccount.solanaAddress, 1),
      ],
      [otherAccount.solanaAddress]: [
        notificationFor(otherAccount.solanaAddress, 1),
      ],
    })
  })

  it('fetches every account at launch, before updateAllNotifications', async () => {
    await renderProvider()

    expect(mockGetNotifications).toHaveBeenCalledWith({
      resource: otherAccount.solanaAddress,
      wallet: currentAccount.solanaAddress,
    })
    expect(storage.notificationsByResource[otherAccount.solanaAddress]).toEqual(
      [notificationFor(otherAccount.solanaAddress, 1)],
    )
  })

  it('updateAllNotifications fetches every account and refetches the current resources', async () => {
    await renderProvider()
    mockGetNotifications.mockClear()

    await act(async () => storage.updateAllNotifications())
    await flush()

    expect(mockGetNotifications).toHaveBeenCalledWith({
      resource: otherAccount.solanaAddress,
      wallet: currentAccount.solanaAddress,
    })
    expect(fetchedResources()).toEqual(
      expect.arrayContaining([
        'wallet-update',
        'helium-update',
        currentAccount.solanaAddress,
      ]),
    )
    expect(storage.notificationsByResource[otherAccount.solanaAddress]).toEqual(
      [notificationFor(otherAccount.solanaAddress, 1)],
    )
  })

  it('polls only the current resources every five minutes', async () => {
    await renderProvider()
    await act(async () => storage.updateAllNotifications())
    await flush()
    mockGetNotifications.mockClear()

    await act(async () => {
      await jest.advanceTimersByTimeAsync(FIVE_MINUTES_MS)
    })

    expect(fetchedResources().sort()).toEqual(
      ['wallet-update', 'helium-update', currentAccount.solanaAddress].sort(),
    )
  })

  it('markNotificationRead posts the read and stamps viewedAt on success', async () => {
    mockPostNotificationRead.mockResolvedValue(undefined)
    await renderProvider()
    expect(storage.notifications[0].viewedAt).toBeNull()

    await act(async () =>
      storage.markNotificationRead({
        id: 1,
        resource: currentAccount.solanaAddress,
      }),
    )
    await flush()

    expect(mockPostNotificationRead).toHaveBeenCalledWith({
      id: 1,
      resource: currentAccount.solanaAddress,
      accounts: [currentAccount, otherAccount],
    })
    expect(
      storage.notificationsByResource[currentAccount.solanaAddress][0].viewedAt,
    ).toEqual(expect.any(String))
    expect(storage.notifications[0].viewedAt).toEqual(expect.any(String))
  })

  it('fetches nothing without a current account', async () => {
    mockAccountStorage = { currentAccount: undefined, sortedAccounts: [] }

    await renderProvider()
    await act(async () => storage.updateAllNotifications())
    await flush()

    expect(mockGetNotifications).not.toHaveBeenCalled()
    expect(storage.notificationsByResource).toEqual({})
  })
})
