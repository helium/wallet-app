import axios from 'axios'
import Config from 'react-native-config'
import { Cluster } from '@solana/web3.js'
import { heliumAddressFromSolAddress } from '@helium/spl-utils'
import { getSecureItem } from '../storage/secureStorage'
import { AccountBalance, Prices } from '../types/balance'
import makeApiToken from './makeApiToken'
import { CSAccount } from '../storage/cloudStorage'

export type Notification = {
  title: string
  body: string
  time: string
  id: number
  createdAt: string
  updatedAt: string
  viewedAt: string
  identifier: string
  icon: string
  resource: string
  type: string
  deliveryTimeOfDay: string
  actionTitle: string
  actionUrl: string
  uuid: string
}

const axiosInstance = axios.create({
  headers: { 'Content-Type': 'application/json' },
  baseURL: Config.WALLET_REST_URI,
})

axiosInstance.interceptors.request.use(async (config) => {
  if (config.headers.Authorization) return config

  const token = await getSecureItem('walletApiToken')
  // eslint-disable-next-line no-param-reassign
  config.headers.Authorization = token ? `Bearer ${token}` : ''
  return config
})

export const getTokenPrices = async (currency: string) => {
  const { data } = await axiosInstance.get<Prices>(
    `/prices/fetchTokenPrices?tokens=helium,solana,helium-iot,helium-mobile&currency=${currency}`,
  )
  return data
}

export const getBalanceHistory = async ({
  solanaAddress,
  cluster,
  currency,
}: {
  solanaAddress: string
  cluster: Cluster
  currency: string
}) => {
  const url = `/balances/${solanaAddress}?cluster=${cluster}&currency=${currency.toLowerCase()}`
  const { data } = await axiosInstance.get<AccountBalance[]>(url)
  return data
}

export const getNotifications = async ({
  resource,
  wallet,
}: {
  resource: string
  wallet?: string
}) => {
  // We need to override the stored api token because we may be requesting notifications for
  // a wallet that is not currently the "currentAccount"
  let config = {}
  try {
    const heliumAddress = heliumAddressFromSolAddress(resource)
    const token = await makeApiToken(heliumAddress)
    config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  } catch {}

  const url = `/notifications/${resource}?wallet=${wallet}`
  const { data } = await axiosInstance.get<Notification[]>(url, config)
  return data
}

export const postNotificationRead = async ({
  id,
  resource,
  accounts,
}: {
  id: number
  resource: string
  accounts: CSAccount[]
}) => {
  // We need to override the stored api token because we may be requesting notifications for
  // a wallet that is not currently the "currentAccount"
  let config = {}
  try {
    const heliumAddress = heliumAddressFromSolAddress(resource)
    const token = await makeApiToken(heliumAddress)
    config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  } catch {}

  const wallets = accounts.map((a) => a.solanaAddress).join(',')

  const url = '/notifications/markRead'
  return axiosInstance.put(url, { id, wallets }, config)
}

export const postPayment = async ({
  signatures,
  cluster,
}: {
  signatures: string[]
  cluster: Cluster
}) => {
  const url = `/payments?cluster=${cluster}`
  return axiosInstance.post(url, { signature: signatures[0], signatures })
}

export const getRecommendedDapps = async () => {
  const { data } = await axiosInstance.get<Record<Cluster, string[]>>(
    '/recommendedDapps',
  )
  return data
}

export const getBasePriorityFee = async () => {
  try {
    const { data } = await axiosInstance.get<{ basePriorityFee: number }>(
      '/basePriorityFee',
    )
    return data.basePriorityFee
  } catch (e: any) {
    // Do not block on this failing
    console.error(e)
    return 1
  }
}

export const getSessionKey = async () => {
  const { data } = await axiosInstance.get<{ sessionKey: string }>(
    '/sessionKey',
  )
  return data?.sessionKey
}

export type Explorer = {
  label: string
  value: string
  image: string
  urlTemplate: string
}
export const getExplorers = async () => {
  const { data } = await axiosInstance.get<Explorer[]>('/explorers')
  return data
}
