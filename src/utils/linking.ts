import Address from '@helium/address'
import { LinkingOptions } from '@react-navigation/native'
import BigNumber from 'bignumber.js'
import BN from 'bn.js'
import * as Linking from 'expo-linking'
import qs from 'qs'
import queryString from 'query-string'
import { BurnRouteParam, PaymentRouteParam } from '../features/home/homeTypes'
import { RootStackParamList } from '../navigation/rootTypes'
import { useAccountStorage } from '../storage/AccountStorageProvider'
import { solAddressIsValid } from './accountUtils'

export const APP_LINK_SCHEME = Linking.createURL('')
export const PAYMENT_PATH = 'payment'
export const HELIUM_WALLET_LINK_SCHEME = 'https://wallet.helium.com/'

export type SendDetails = {
  payee: string
  balanceAmount: BN
  max?: boolean
}

export const authenticatedLinking: LinkingOptions<RootStackParamList> = {
  prefixes: [APP_LINK_SCHEME, HELIUM_WALLET_LINK_SCHEME],
  config: {
    screens: {
      LinkWallet: 'link_wallet',
      SignHotspot: 'sign_hotspot',
      PaymentScreen: 'payment',
      DappLoginScreen: 'dapp_login',
      ImportPrivateKey: 'import_key/:key',
      TabBarNavigator: {
        screens: {
          Governance: {
            screens: {
              GovernanceScreen: 'governance/:mint/proposal/:proposal',
            },
          },
        },
      },
    },
  },
  getInitialURL: async () => {
    const url = await Linking.getInitialURL()
    return url
  },
}

export const unauthenticatedLinking: LinkingOptions<RootStackParamList> = {
  prefixes: [APP_LINK_SCHEME, HELIUM_WALLET_LINK_SCHEME],
  config: {
    screens: {
      OnboardingNavigator: {
        screens: {
          ImportPrivateKey: 'import_key/:key',
        },
      },
    },
  },
}

export const useDeepLinking = () => {
  const { restored: accountsRestored } = useAccountStorage()

  if (accountsRestored) {
    return authenticatedLinking
  }

  return unauthenticatedLinking
}

export const makePayRequestLink = ({
  payee,
  balanceAmount,
  mint,
}: Partial<SendDetails> & { mint?: string }) => {
  return [
    HELIUM_WALLET_LINK_SCHEME + PAYMENT_PATH,
    qs.stringify(
      {
        payee,
        amount: balanceAmount?.toString(),
        memo: '',
        mint,
      },
      { skipNulls: true },
    ),
  ].join('?')
}

export const parseBurn = (qrContent: string) => {
  try {
    const parsedJson = JSON.parse(qrContent)
    const isBurn =
      parsedJson.type === 'dc_burn' && parsedJson.amount !== undefined

    if (!isBurn) return false

    return parsedJson as BurnRouteParam
  } catch (e) {
    return false
  }
}

export const parseDelegate = (qrContent: string) => {
  try {
    const parsedJson = JSON.parse(qrContent)
    const isDelegate = parsedJson.type === 'dc_delegate'

    if (!isDelegate) return false

    return parsedJson as BurnRouteParam
  } catch (e) {
    return false
  }
}

export const parsePaymentLink = (
  urlOrAddress: string,
): PaymentRouteParam | undefined => {
  if (Address.isValid(urlOrAddress) || solAddressIsValid(urlOrAddress)) {
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

    if (parsedJson.amount !== undefined) {
      const amount =
        typeof parsedJson.amount === 'string'
          ? parseFloat(parsedJson.amount)
          : parsedJson.amount
      return {
        payee: parsedJson.address || parsedJson.payee,
        payer: parsedJson.payer,
        amount: new BigNumber(amount).dividedBy(10 ** 8).toString(),
        memo: '',
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
          amount: new BigNumber(amountFloat).dividedBy(10 ** 8).toString(),
          payee: address,
          memo: '',
        }
      })
      return { payments: JSON.stringify(payments) }
    }
  } catch (e) {}
}

export default authenticatedLinking
