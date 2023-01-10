/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-restricted-properties */
import { PublicKey } from '@solana/web3.js'
import { useMemo } from 'react'
import * as tm from '@helium/treasury-management-sdk'
import { amountAsNum } from '@helium/spl-utils'
import { useMint } from './useMint'
import { useTreasuryManagement } from './useTreasuryManagement'
import { useOwnedAmount } from './useOwnedAmount'

export function useTreasuryPrice(
  fromMint: PublicKey,
  amount: number,
): { loading: boolean; price: number | undefined; freezeDate: Date } {
  const treasuryManagementKey = useMemo(
    () => tm.treasuryManagementKey(fromMint)[0],
    [fromMint],
  )
  const { info: treasuryAcc, loading: loadingTreasuryManagement } =
    useTreasuryManagement(treasuryManagementKey)
  const { info: fromMintAcc, loading: loadingFromMint } = useMint(fromMint)
  const { info: treasuryMintAcc, loading: loadingTreasuryMint } = useMint(
    treasuryAcc?.treasuryMint,
  )
  const freezeDate =
    treasuryAcc?.freezeUnixTime &&
    typeof treasuryAcc.freezeUnixTime === 'number'
      ? new Date(treasuryAcc.freezeUnixTime * 1000)
      : new Date()

  const {
    amount: r,
    decimals: rDecimals,
    loading: loadingR,
  } = useOwnedAmount(treasuryManagementKey, treasuryAcc?.treasuryMint)

  const price = useMemo(() => {
    if (
      fromMintAcc &&
      treasuryMintAcc &&
      treasuryAcc &&
      typeof r !== 'undefined'
    ) {
      // only works for basic exponential curves
      // dR = (R / S^(1 + k)) ((S + dS)^(1 + k) - S^(1 + k))
      const S = Number(
        (fromMintAcc as any).info.supply /
          BigInt(Math.pow(10, (fromMintAcc as any).info.decimals)),
      )

      const R = amountAsNum(BigInt(r), rDecimals)

      const k =
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        treasuryAcc.curve.exponentialCurveV0.k.toNumber() / Math.pow(10, 12)
      // console.log('tm3', S, R, k)
      const dR =
        (R / Math.pow(S, k + 1)) *
        (Math.pow(S - amount, k + 1) - Math.pow(S, k + 1))

      const total = Math.abs(dR)
      // Truncate to 8 decimal places only
      return total.toFixed(rDecimals)
    }
  }, [fromMintAcc, treasuryMintAcc, treasuryAcc, r, rDecimals, amount])

  const loading =
    loadingTreasuryManagement ||
    loadingFromMint ||
    loadingTreasuryMint ||
    loadingR
  return { price, loading, freezeDate }
}
