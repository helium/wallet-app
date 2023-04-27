import axios from 'axios'
import Config from 'react-native-config'
import { Cluster } from '@solana/web3.js'
import { getSecureItem } from '../storage/secureStorage'
import { AccountBalance, Prices } from '../types/balance'

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

export const getNotifications = async ({ resource }: { resource: string }) => {
  const url = `/notifications/${resource}`
  const { data } = await axiosInstance.get<Notification[]>(url)
  return data
}

export const postNotificationRead = async ({ id }: { id: number }) => {
  const url = '/notifications/markRead'
  const response = await axiosInstance.post(url, { id })
  // eslint-disable-next-line no-console
  console.log('post notification read', response.status)
  // TODO: Verify this works
  return response
}
