import Address from '@helium/address'
import Balance, { CurrencyType } from '@helium/currency'
import * as Linking from 'expo-linking'
import qs from 'qs'
import queryString from 'query-string'
import BigNumber from 'bignumber.js'
import { LinkingOptions } from '@react-navigation/native'
import { encodeMemoString } from '../components/MemoInput'
import {
  HomeStackParamList,
  PaymentRouteParam,
} from '../features/home/homeTypes'
import { SendDetails } from '../storage/TransactionProvider'
import { TokenType } from '../types/activity'

export const APP_LINK_SCHEME = Linking.createURL('')
export const PAYMENT_PATH = 'payment'
export const HELIUM_WALLET_LINK_SCHEME = 'https://wallet.helium.com/'

const formatMemo = (memo: string | undefined, isUtf8: boolean) => {
  if (!memo) return undefined
  return isUtf8 ? encodeMemoString(memo) : memo
}

export const linking: LinkingOptions<HomeStackParamList> = {
  prefixes: [APP_LINK_SCHEME, HELIUM_WALLET_LINK_SCHEME],
  config: {
    screens: {
      LinkWallet: 'link_wallet',
      SignHotspot: 'sign_hotspot',
      PaymentScreen: 'payment',
      RequestScreen: 'request',
      DappLoginScreen: 'dapp_login',
    },
    initialRouteName: 'AccountsScreen',
  },
}

export const makePayRequestLink = ({
  payee,
  balanceAmount,
  memo,
  defaultTokenType,
}: Partial<SendDetails> & { defaultTokenType?: TokenType }) => {
  return [
    HELIUM_WALLET_LINK_SCHEME + PAYMENT_PATH,
    qs.stringify(
      {
        payee,
        amount: balanceAmount?.integerBalance || null,
        memo: encodeMemoString(memo),
        defaultTokenType,
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
  payments: Array<Partial<SendDetails> & { defaultTokenType?: TokenType }>
}) => {
  const ironed = payments.map(
    ({ payee: address, balanceAmount, memo, defaultTokenType }) => ({
      payee: address || null,
      amount: balanceAmount?.integerBalance || null,
      memo: encodeMemoString(memo),
      defaultTokenType,
    }),
  )
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

  // Handle hotspot app payment format
  try {
    const parsedJson = JSON.parse(urlOrAddress)
    if (
      parsedJson.type !== 'payment' ||
      (parsedJson.amount === undefined && !parsedJson.payees)
    ) {
      // This is not a hotspot app link
      return
    }

    const { coefficient } = new Balance(0, CurrencyType.networkToken).type

    if (parsedJson.amount !== undefined) {
      const amount =
        typeof parsedJson.amount === 'string'
          ? parseFloat(parsedJson.amount)
          : parsedJson.amount
      return {
        payee: parsedJson.address || parsedJson.payee,
        payer: parsedJson.payer,
        amount: new BigNumber(amount).dividedBy(coefficient).toString(),
        memo: formatMemo(parsedJson.memo, parsedJson.utf8Memo),
      }
    }
    if (parsedJson.payees) {
      const payments = Object.keys(parsedJson.payees).map((address) => {
        const payeeData = parsedJson.payees[address]
        const amount =
          typeof payeeData === 'object' ? payeeData.amount : payeeData
        const amountFloat =
          typeof amount === 'string' ? parseFloat(amount) : amount
        return {
          amount: new BigNumber(amountFloat).dividedBy(coefficient).toString(),
          payee: address,
          memo:
            typeof payeeData === 'object'
              ? formatMemo(payeeData.memo, parsedJson.utf8Memo)
              : undefined,
        }
      })
      return { payments: JSON.stringify(payments) }
    }
  } catch (e) {}
}

export default linking
