/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-restricted-properties */
import { PublicKey } from '@solana/web3.js'
import { useMemo } from 'react'
import * as tm from '@helium/treasury-management-sdk'
import { amountAsNum } from '@helium/spl-utils'
import { useOwnedAmount, useMint } from '@helium/helium-react-hooks'
import { useTreasuryManagement } from './useTreasuryManagement'

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
      typeof r !== 'undefined' &&
      rDecimals !== undefined
    ) {
      // only works for basic exponential curves
      // dR = (R / S^(1 + k)) ((S + dS)^(1 + k) - S^(1 + k))
      const S = Number(
        fromMintAcc.supply / BigInt(Math.pow(10, fromMintAcc.decimals)),
      )

      const R = amountAsNum(r, rDecimals)

      const k =
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        treasuryAcc.curve.exponentialCurveV0.k.toNumber() / Math.pow(10, 12)
      // console.log('tm3', S, R, k)
      const dR =
        (R / Math.pow(S, k + 1)) *
        (Math.pow(S - amount, k + 1) - Math.pow(S, k + 1))

      const total = toFixed(Math.abs(dR))

      return total
    }
  }, [fromMintAcc, treasuryMintAcc, treasuryAcc, r, rDecimals, amount])

  const loading =
    loadingTreasuryManagement ||
    loadingFromMint ||
    loadingTreasuryMint ||
    loadingR
  return { price, loading, freezeDate }
}

function toFixed(x: any): any {
  let realNumber = x.toString()
  let xCopy = x

  if (realNumber.split('e-')[1]) {
    if (Math.abs(x) < 1.0) {
      const e = parseInt(x.toString().split('e-')[1], 10)
      if (e) {
        xCopy = x * Math.pow(10, e - 1)
        realNumber = `0.${new Array(e).join('0')}${xCopy
          .toString()
          .substring(2)}`
      }
    } else {
      let e = parseInt(x.toString().split('+')[1], 10)
      if (e > 20) {
        e -= 20
        xCopy /= Math.pow(10, e)
        realNumber = xCopy + new Array(e + 1).join('0')
      }
    }
  }

  // Only allow max 8 decimal places
  const decimalIndex = realNumber.indexOf('.')
  if (decimalIndex !== -1) {
    realNumber = realNumber.substring(0, decimalIndex + 9)
  }
  return realNumber
}
