import { useMemo } from 'react'
import Balance, {
  AnyCurrencyType,
  Ticker,
  DataCredits,
  MobileTokens,
  NetworkTokens,
  SecurityTokens,
  SolTokens,
  IotTokens,
} from '@helium/currency'
import { useBalance } from '../utils/Balance'

export function useTokenList(): {
  tokens: Token[]
} {
  const {
    dcBalance,
    mobileBalance,
    iotBalance,
    networkBalance,
    networkStakedBalance,
    secBalance,
    solBalance,
  } = useBalance()

  const tokens: Token[] = useMemo(
    () => [
      {
        type: 'HNT',
        balance: networkBalance as Balance<NetworkTokens>,
        staked: false,
        canShow: true,
      },
      {
        type: 'HNT',
        balance: networkStakedBalance as Balance<NetworkTokens>,
        staked: true,
        canShow: false,
      },
      {
        type: 'MOBILE',
        balance: mobileBalance as Balance<MobileTokens>,
        staked: false,
        canShow: true,
      },
      {
        type: 'IOT',
        balance: iotBalance as Balance<IotTokens>,
        staked: false,
        canShow: false,
      },
      {
        type: 'DC',
        balance: dcBalance as Balance<DataCredits>,
        staked: false,
        canShow: false,
      },
      {
        type: 'HST',
        balance: secBalance as Balance<SecurityTokens>,
        staked: false,
        canShow: false,
      },
      {
        type: 'SOL',
        balance: solBalance as Balance<SolTokens>,
        staked: false,
        canShow: true,
      },
    ],
    [
      dcBalance,
      iotBalance,
      mobileBalance,
      networkBalance,
      networkStakedBalance,
      secBalance,
      solBalance,
    ],
  )

  return {
    tokens,
  }
}

//
// Utils
//

export type Token = {
  type: Ticker
  balance: Balance<AnyCurrencyType>
  staked: boolean
  canShow: boolean
}
