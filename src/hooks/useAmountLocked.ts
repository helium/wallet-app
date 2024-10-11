import { getPositionKeysForOwner } from '@helium/voter-stake-registry-sdk'
import { PublicKey } from '@solana/web3.js'
import React, { useMemo } from 'react'
import { useAsync } from 'react-async-hook'
import { useCurrentWallet } from './useCurrentWallet'
import { useSolana } from '@/solana/SolanaProvider'
import {
  useHeliumVsrState,
  usePositions,
} from '@helium/voter-stake-registry-hooks'
import { BN } from 'bn.js'

const useAmountLocked = (mint: PublicKey) => {
  const wallet = useCurrentWallet()
  const { anchorProvider, connection } = useSolana()

  const { positions: contextPositions, mint: govMint } = useHeliumVsrState()

  const useContextPositions = useMemo(
    () => !!govMint?.equals(mint),
    [govMint, mint],
  )

  const args = useMemo(
    () =>
      wallet &&
      mint &&
      connection && {
        wallet,
        mint,
        provider: anchorProvider,
      },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [wallet?.toBase58(), mint.toBase58(), connection, anchorProvider],
  )

  const { result } = useAsync(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (args: any | undefined, useContext: boolean) => {
      if (args && !useContext) {
        return getPositionKeysForOwner(args)
      }
    },
    [args, useContextPositions],
  )

  const { accounts: fetchedPositions, loading: loadingFetchedPositions } =
    usePositions(result?.positions)

  const positions = useMemo(
    () =>
      useContextPositions
        ? contextPositions
        : fetchedPositions?.map((fetched) => fetched.info),
    [useContextPositions, contextPositions, fetchedPositions],
  )

  const { amountLocked } = useMemo(() => {
    if (positions && positions.length) {
      let amountLocked = new BN(0)
      positions.forEach((position) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        if (position && !position.isProxiedToMe) {
          amountLocked = amountLocked.add(position.amountDepositedNative)
        }
      })

      return {
        amountLocked,
      }
    }

    return {}
  }, [positions])

  return {
    amountLocked,
  }
}

export default useAmountLocked
