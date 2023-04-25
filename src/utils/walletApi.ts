import axios from 'axios'
import Config from 'react-native-config'
import { getSecureItem } from '../storage/secureStorage'
import { Prices } from '../types/balance'

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
