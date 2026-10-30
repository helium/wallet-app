import { QueryObserver } from '@tanstack/react-query'
import { createQueryClient } from '../../../utils/queryClient'
import { getNotifications, Notification } from '../../../utils/walletApiV2'
import {
  markNotificationViewed,
  notificationsQuery,
  notificationsQueryKey,
} from '../notificationsQuery'

jest.mock('../../../utils/walletApiV2', () => ({
  getNotifications: jest.fn(),
}))

const notification = (id: number, resource: string) =>
  ({ id, resource, viewedAt: null } as unknown as Notification)

const viewedAt = '2026-10-28T12:00:00.000Z'

describe('notificationsQuery', () => {
  it('fetches the notifications of a resource for the current wallet', async () => {
    const queryClient = createQueryClient()
    const list = [notification(1, 'helium-update')]
    jest.mocked(getNotifications).mockResolvedValue(list)

    await expect(
      queryClient.fetchQuery(notificationsQuery('helium-update', 'walletA')),
    ).resolves.toEqual(list)
    expect(getNotifications).toHaveBeenCalledWith({
      resource: 'helium-update',
      wallet: 'walletA',
    })
    queryClient.clear()
  })

  it('fetches only once a wallet is known', async () => {
    const queryClient = createQueryClient()
    jest.mocked(getNotifications).mockClear().mockResolvedValue([])
    const observe = async (wallet?: string) => {
      const unsubscribe = new QueryObserver(
        queryClient,
        notificationsQuery('helium-update', wallet),
      ).subscribe(() => undefined)
      await new Promise(process.nextTick)
      unsubscribe()
    }

    await observe()
    expect(getNotifications).not.toHaveBeenCalled()

    await observe('walletA')
    expect(getNotifications).toHaveBeenCalledWith({
      resource: 'helium-update',
      wallet: 'walletA',
    })
    queryClient.clear()
  })
})

describe('markNotificationViewed', () => {
  it('stamps the read notification in every cached list of its resource only', () => {
    const queryClient = createQueryClient()
    const walletA = notificationsQueryKey('helium-update', 'walletA')
    const walletB = notificationsQueryKey('helium-update', 'walletB')
    const other = notificationsQueryKey('wallet-update', 'walletA')
    queryClient.setQueryData(walletA, [
      notification(1, 'helium-update'),
      notification(2, 'helium-update'),
    ])
    queryClient.setQueryData(walletB, [notification(2, 'helium-update')])
    queryClient.setQueryData(other, [notification(2, 'wallet-update')])

    markNotificationViewed(queryClient, 'helium-update', 2, viewedAt)

    expect(
      queryClient.getQueryData<Notification[]>(walletA)?.map((n) => n.viewedAt),
    ).toEqual([null, viewedAt])
    expect(
      queryClient.getQueryData<Notification[]>(walletB)?.map((n) => n.viewedAt),
    ).toEqual([viewedAt])
    expect(
      queryClient.getQueryData<Notification[]>(other)?.map((n) => n.viewedAt),
    ).toEqual([null])
    queryClient.clear()
  })
})
