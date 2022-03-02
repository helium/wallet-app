import { NetType } from '@helium/crypto-react-native'
import Balance, {
  CurrencyType,
  DataCredits,
  NetworkTokens,
  TestNetworkTokens,
} from '@helium/currency'
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  AccountData,
  useAccountQuery,
  useOracleDataQuery,
} from '../generated/graphql'
import { CSAccount, useAccountStorage } from '../storage/AccountStorageProvider'
import { accountCurrencyType } from './accountUtils'
import { decimalSeparator, groupSeparator } from './i18n'
import usePrevious from './usePrevious'

export const ORACLE_POLL_INTERVAL = 1000 * 15 * 60 // 15 minutes
const useBalanceHook = ({ clientReady }: { clientReady: boolean }) => {
  const { currentAccount } = useAccountStorage()

  const { data, loading, error } = useOracleDataQuery({
    variables: {
      address: currentAccount?.address || '',
    },
    fetchPolicy: 'network-only',
    pollInterval: ORACLE_POLL_INTERVAL,
    notifyOnNetworkStatusChange: true,
    skip: !clientReady || !currentAccount?.address,
  })
  const { data: accountData } = useAccountQuery({
    variables: {
      address: currentAccount?.address || '',
    },
    fetchPolicy: 'cache-only',
    skip: !currentAccount?.address,
  })

  const prevLoading = usePrevious(loading)
  const [oracleDateTime, setOracleDateTime] = useState<Date>()

  useEffect(() => {
    if (prevLoading && !loading && data && !error) {
      setOracleDateTime(new Date())
    }
  }, [data, error, loading, prevLoading])

  const dcToTokens = useCallback(
    (
      priceBalance: Balance<DataCredits>,
    ): Balance<TestNetworkTokens | NetworkTokens> | undefined => {
      if (!data?.currentOraclePrice?.price) return

      const {
        currentOraclePrice: { price },
      } = data
      const oraclePrice = new Balance(price, CurrencyType.usd)

      if (currentAccount?.netType === NetType.TESTNET) {
        return priceBalance.toTestNetworkTokens(oraclePrice)
      }
      return priceBalance.toNetworkTokens(oraclePrice)
    },
    [currentAccount, data],
  )

  const floatToBalance = useCallback(
    (value: number, account?: CSAccount | null) => {
      let acct = account
      if (!acct) {
        acct = currentAccount
      }
      if (!acct) {
        console.warn('Cannot convert float to balance for nil account')
        return
      }
      return Balance.fromFloat(value, accountCurrencyType(acct.address))
    },
    [currentAccount],
  )

  const intToBalance = useCallback(
    (opts: { intValue?: number; account?: CSAccount }) => {
      let val = 0
      let account = currentAccount
      if (opts.intValue) {
        val = opts.intValue
      }
      if (opts.account) {
        account = opts.account
      }
      if (val === undefined || !account) {
        console.warn('Cannot convert int to balance')
        return
      }
      return new Balance(val, accountCurrencyType(account?.address))
    },
    [currentAccount],
  )

  const zeroBalanceNetworkToken = useMemo(
    () => new Balance(0, accountCurrencyType(currentAccount?.address)),
    [currentAccount],
  )

  const accountBalance = useCallback(
    (opts?: { intValue: number; account: CSAccount }) => {
      let val = accountData?.account?.balance
      let account = currentAccount
      if (opts) {
        val = opts.intValue
        account = opts.account
      }
      if (val === undefined || !account) {
        console.warn('Cannot convert int to balance')
        return
      }
      return new Balance(val, accountCurrencyType(account?.address))
    },
    [accountData, currentAccount],
  )

  return {
    accountBalance,
    dcToTokens,
    floatToBalance,
    intToBalance,
    oracleDateTime,
    zeroBalanceNetworkToken,
  }
}

const initialState = {
  accountBalance: () => undefined,
  dcToTokens: () => undefined,
  floatToBalance: () => undefined,
  intToBalance: () => undefined,
  oracleDateTime: undefined,
  zeroBalanceNetworkToken: new Balance(0, CurrencyType.networkToken),
}

const BalanceContext =
  createContext<ReturnType<typeof useBalanceHook>>(initialState)
const { Provider } = BalanceContext

export const BalanceProvider = ({
  children,
  clientReady,
}: {
  children: ReactNode
  clientReady: boolean
}) => {
  return <Provider value={useBalanceHook({ clientReady })}>{children}</Provider>
}

export const useBalance = () => useContext(BalanceContext)

export const balanceToString = (
  balance?: Balance<DataCredits | NetworkTokens | TestNetworkTokens>,
  opts?: { maxDecimalPlaces?: number; showTicker?: boolean },
) => {
  if (!balance) return ''
  return balance.toString(opts?.maxDecimalPlaces, {
    groupSeparator,
    decimalSeparator,
    showTicker: opts?.showTicker,
  })
}

export const useAccountBalances = (
  accountData: AccountData | null | undefined,
) =>
  useMemo(() => {
    if (!accountData) return
    const currencyType = accountCurrencyType(accountData.address)

    return {
      hnt: new Balance(accountData.balance || 0, currencyType),
      dc: new Balance(accountData.dcBalance || 0, CurrencyType.dataCredit),
      stakedHnt: new Balance(accountData.stakedBalance || 0, currencyType),
      hst: new Balance(accountData.secBalance || 0, CurrencyType.security),
    }
  }, [accountData])
