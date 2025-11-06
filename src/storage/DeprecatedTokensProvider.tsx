import {
  getPositionKeysForOwner,
  getRegistrarKey,
} from '@helium/voter-stake-registry-sdk'
import { useOwnedAmount } from '@helium/helium-react-hooks'
import { IOT_MINT, MOBILE_MINT } from '@helium/spl-utils'
import { usePositions } from '@helium/voter-stake-registry-hooks'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import BN from 'bn.js'
import React, { createContext, ReactNode, useContext, useMemo } from 'react'
import { useAsync } from 'react-async-hook'
import { useSolana } from '../solana/SolanaProvider'

interface DeprecatedTokensContextState {
  // IOT data
  iotBalance: BN | undefined
  iotDecimals: number | undefined
  iotStaked: BN | undefined
  iotPositions: any[] | undefined

  // MOBILE data
  mobileBalance: BN | undefined
  mobileDecimals: number | undefined
  mobileStaked: BN | undefined
  mobilePositions: any[] | undefined

  // Computed values
  totalIot: BN
  totalMobile: BN
  hasIot: boolean
  hasMobile: boolean
  hasStakedIot: boolean
  hasStakedMobile: boolean
  hasStaked: boolean
  hasAnyTokens: boolean
  hasDeprecatedTokens: boolean

  // Loading states
  isLoadingPositions: boolean
  loading: boolean
}

const DeprecatedTokensContext = createContext<
  DeprecatedTokensContextState | undefined
>(undefined)

export const DeprecatedTokensProvider: React.FC<{
  children: ReactNode
}> = ({ children }) => {
  const wallet = useCurrentWallet()
  const { anchorProvider } = useSolana()

  // Batch fetch position keys for both IOT and MOBILE to reduce RPC calls
  const { result: positionKeysData, loading: loadingPositionKeys } =
    useAsync(async () => {
      if (!wallet || !anchorProvider?.connection) {
        return undefined
      }

      try {
        // Batch both position key fetches in parallel
        const [iotPositionKeys, mobilePositionKeys] = await Promise.all([
          getPositionKeysForOwner({
            registrar: getRegistrarKey(IOT_MINT),
            owner: wallet,
            connection: anchorProvider.connection,
          }),
          getPositionKeysForOwner({
            registrar: getRegistrarKey(MOBILE_MINT),
            owner: wallet,
            connection: anchorProvider.connection,
          }),
        ])

        return {
          iotPositionKeys,
          mobilePositionKeys,
        }
      } catch (error) {
        console.error(
          '[DeprecatedTokensProvider] Position keys batch fetch error:',
          error,
        )
        return undefined
      }
    }, [wallet, anchorProvider?.connection])

  // Extract individual results for compatibility
  const iotPositionKeys = positionKeysData?.iotPositionKeys
  const mobilePositionKeys = positionKeysData?.mobilePositionKeys
  const loadingIotPositionKeys = loadingPositionKeys
  const loadingMobilePositionKeys = loadingPositionKeys

  // Fetch positions
  const { accounts: iotPositions, loading: loadingIotPositions } = usePositions(
    iotPositionKeys?.positions,
  )
  const { accounts: mobilePositions, loading: loadingMobilePositions } =
    usePositions(mobilePositionKeys?.positions)

  // Get unstaked balances
  const { amount: iotBalance, decimals: iotDecimals } = useOwnedAmount(
    wallet,
    IOT_MINT,
  )
  const { amount: mobileBalance, decimals: mobileDecimals } = useOwnedAmount(
    wallet,
    MOBILE_MINT,
  )

  // Calculate staked amounts
  const iotStaked = useMemo(
    () =>
      iotPositions?.reduce(
        (acc, p) => acc.add(p.info?.amountDepositedNative || new BN(0)),
        new BN(0),
      ),
    [iotPositions],
  )

  const mobileStaked = useMemo(
    () =>
      mobilePositions?.reduce(
        (acc, p) => acc.add(p.info?.amountDepositedNative || new BN(0)),
        new BN(0),
      ),
    [mobilePositions],
  )

  // Total IOT and MOBILE
  const totalIot = useMemo(
    () => new BN(iotBalance?.toString() || '0').add(iotStaked || new BN(0)),
    [iotBalance, iotStaked],
  )

  const totalMobile = useMemo(
    () =>
      new BN(mobileBalance?.toString() || '0').add(mobileStaked || new BN(0)),
    [mobileBalance, mobileStaked],
  )

  const hasIot = useMemo(() => totalIot.gt(new BN(0)), [totalIot])
  const hasMobile = useMemo(() => totalMobile.gt(new BN(0)), [totalMobile])

  const hasStakedIot = useMemo(
    () => iotStaked?.gt(new BN(0)) || false,
    [iotStaked],
  )
  const hasStakedMobile = useMemo(
    () => mobileStaked?.gt(new BN(0)) || false,
    [mobileStaked],
  )

  const hasStaked = useMemo(
    () => hasStakedIot || hasStakedMobile,
    [hasStakedIot, hasStakedMobile],
  )

  const hasAnyTokens = useMemo(() => hasIot || hasMobile, [hasIot, hasMobile])

  const hasDeprecatedTokens = useMemo(() => {
    return totalIot.gt(new BN(0)) || totalMobile.gt(new BN(0))
  }, [totalIot, totalMobile])

  const isLoadingPositions = useMemo(
    () =>
      loadingIotPositionKeys ||
      loadingMobilePositionKeys ||
      loadingIotPositions ||
      loadingMobilePositions,
    [
      loadingIotPositionKeys,
      loadingMobilePositionKeys,
      loadingIotPositions,
      loadingMobilePositions,
    ],
  )

  const loading = useMemo(() => isLoadingPositions, [isLoadingPositions])

  const value = useMemo(
    () => ({
      iotBalance: iotBalance ? new BN(iotBalance.toString()) : undefined,
      iotDecimals,
      iotStaked,
      iotPositions,
      mobileBalance: mobileBalance
        ? new BN(mobileBalance.toString())
        : undefined,
      mobileDecimals,
      mobileStaked,
      mobilePositions,
      totalIot,
      totalMobile,
      hasIot,
      hasMobile,
      hasStakedIot,
      hasStakedMobile,
      hasStaked,
      hasAnyTokens,
      hasDeprecatedTokens,
      isLoadingPositions,
      loading,
    }),
    [
      iotBalance,
      iotDecimals,
      iotStaked,
      iotPositions,
      mobileBalance,
      mobileDecimals,
      mobileStaked,
      mobilePositions,
      totalIot,
      totalMobile,
      hasIot,
      hasMobile,
      hasStakedIot,
      hasStakedMobile,
      hasStaked,
      hasAnyTokens,
      hasDeprecatedTokens,
      isLoadingPositions,
      loading,
    ],
  )

  return (
    <DeprecatedTokensContext.Provider value={value}>
      {children}
    </DeprecatedTokensContext.Provider>
  )
}

export const useDeprecatedTokens = () => {
  const context = useContext(DeprecatedTokensContext)
  if (!context) {
    throw new Error(
      'useDeprecatedTokens must be used within DeprecatedTokensProvider',
    )
  }
  return context
}
