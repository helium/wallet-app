import { Address } from '@helium/crypto-react-native'
import { LinkingOptions } from '@react-navigation/native'
import * as Linking from 'expo-linking'
import qs from 'qs'
import queryString from 'query-string'
import { encodeMemoString } from '../components/MemoInput'
import { PaymentRouteParam } from '../features/home/homeTypes'
import { RootNavigationProp } from '../navigation/rootTypes'
import { SendDetails } from '../storage/TransactionProvider'

export const APP_LINK_SCHEME = Linking.createURL('')
export const PAYMENT_PATH = 'payment'
export const HELIUM_WALLET_LINK_SCHEME = 'https://wallet.helium.com/'

export const linking = {
  prefixes: [APP_LINK_SCHEME, HELIUM_WALLET_LINK_SCHEME],
  config: {
    screens: {
      HomeNavigator: {
        initialRouteName: 'AccountsScreen',
        screens: {
          WifiOnboard: 'wifi',
          LinkWallet: 'link_wallet',
          SignHotspot: 'sign_hotspot',
          PaymentScreen: 'payment',
        },
      },
    },
  },
} as LinkingOptions<RootNavigationProp>

export const makePayRequestLink = ({
  payee,
  balanceAmount,
  memo,
}: Partial<SendDetails>) => {
  return [
    HELIUM_WALLET_LINK_SCHEME + PAYMENT_PATH,
    qs.stringify(
      {
        payee,
        amount: balanceAmount?.integerBalance || null,
        memo: encodeMemoString(memo),
      },
      { skipNulls: true },
    ),
  ].join('?')
}

export const makeMultiPayRequestLink = ({
  payments,
  payer,
}: {
  payer?: string
  payments: Array<Partial<SendDetails>>
}) => {
  const ironed = payments.map(({ payee: address, balanceAmount, memo }) => ({
    payee: address || null,
    amount: balanceAmount?.integerBalance || null,
    memo: encodeMemoString(memo),
  }))
  return [
    HELIUM_WALLET_LINK_SCHEME + PAYMENT_PATH,
    qs.stringify(
      { payer, payments: JSON.stringify(ironed) },
      { skipNulls: true },
    ),
  ].join('?')
}

export const parsePaymentLink = (
  urlOrAddress: string,
): PaymentRouteParam | undefined => {
  if (Address.isValid(urlOrAddress)) {
    const url = makePayRequestLink({ payee: urlOrAddress })
    return queryString.parseUrl(url).query
  }

  const parsed = queryString.parseUrl(urlOrAddress)
  if (
    parsed.url === `${HELIUM_WALLET_LINK_SCHEME}payment` ||
    parsed.url === `${APP_LINK_SCHEME}payment`
  ) {
    return parsed.query
  }
}

export default linking
