/* eslint-disable @typescript-eslint/no-unused-vars */
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useSelector } from 'react-redux'
import { init } from '@helium/lazy-distributor-sdk'
import * as client from '@helium/distributor-oracle'
import { Connection, PublicKey } from '@solana/web3.js'
import { useAsyncCallback } from 'react-async-hook'
import axios from 'axios'
import { AddGatewayV1 } from '@helium/transactions'
import Address from '@helium/address'
import { Keypair } from '@helium/crypto'
import { sendAndConfirmWithRetry } from '@helium/spl-utils'
import { getKeypair } from '../storage/secureStorage'
import { useAccountStorage } from '../storage/AccountStorageProvider'
import { useAppStorage } from '../storage/AppStorageProvider'
import { RootState } from '../store/rootReducer'
import { fetchCollectables } from '../store/slices/collectablesSlice'
import { useAppDispatch } from '../store/store'
import { onLogs, removeAccountChangeListener } from '../utils/solanaUtils'
import { CompressedNFT } from '../types/solana'
import { LAZY_KEY } from '../utils/hotspotNftsUtils'
import useSubmitTxn from '../graphql/useSubmitTxn'

function random(len: number): string {
  return new Array(len).join().replace(/(.|$)/g, () => {
    return (Math.random() * 36 || 0).toString(36)
  })
}

const useHotspots = (): {
  hotspots: CompressedNFT[]
  hotspotsWithMeta: CompressedNFT[]
  loading: boolean
  refresh: () => void
  claimAllRewards: {
    loading: boolean
    error: Error | undefined
    execute: () => Promise<void>
  }
  createHotspot: () => Promise<void>
} => {
  const { solanaNetwork: cluster, l1Network } = useAppStorage()
  const dispatch = useAppDispatch()
  const accountSubscriptionId = useRef<number>()
  const { currentAccount, anchorProvider } = useAccountStorage()
  const collectables = useSelector((state: RootState) => state.collectables)
  const { submitAllAnchorTxns } = useSubmitTxn()

  const hotspots = useMemo(() => {
    if (!currentAccount?.solanaAddress) return []

    return (
      collectables[currentAccount?.solanaAddress].collectables.HOTSPOT || []
    )
  }, [collectables, currentAccount])

  const claimAllRewards = async () => {
    if (!anchorProvider || !currentAccount?.solanaAddress) {
      return
    }
    const program = await init(anchorProvider)
    const wallet = new PublicKey(currentAccount?.solanaAddress)

    const txns = await Promise.all(
      hotspots.map(async (nft) => {
        const rewards = await client.getCurrentRewards(
          program,
          LAZY_KEY,
          new PublicKey(nft.id),
        )
        return client.formTransaction({
          program,
          provider: anchorProvider,
          rewards,
          hotspot: new PublicKey(nft.id),
          lazyDistributor: LAZY_KEY,
          wallet,
        })
      }),
    )

    await submitAllAnchorTxns(txns)
  }

  const { execute, loading, error } = useAsyncCallback(claimAllRewards)

  const refresh = useCallback(() => {
    if (
      !currentAccount?.solanaAddress ||
      l1Network !== 'solana' ||
      collectables.loading
    ) {
      return
    }
    dispatch(fetchCollectables({ account: currentAccount, cluster }))
  }, [cluster, collectables.loading, currentAccount, dispatch, l1Network])

  const createHotspot = useCallback(async () => {
    if (!currentAccount || !anchorProvider || !currentAccount.solanaAddress)
      return

    const secureStorage = await getKeypair(currentAccount.address)
    if (!secureStorage) return

    const owner = new Keypair(secureStorage.keypair)
    const onboardingKey = random(10)
    const gateway = await Keypair.makeRandom()
    const maker = Address.fromB58(
      '13AjXWhBNWdxq63dSQmPvRx3uQtaa3pMu5wXB1bPUZTTYEiwpgC',
    )

    await axios.post(
      'https://onboarding.oracle.test-helium.com/api/v2/hotspots',
      {
        onboardingKey,
        macWlan0: random(10),
        macEth0: random(10),
        rpiSerial: random(10),
        heliumSerial: random(10),
        batch: 'example-batch',
      },
      {
        headers: {
          authorization:
            'pk_cc0LfShOEengfvg/w1y6JLoOQjD090MxDa8N7+rn73w=:sk_IrcEnnhcgI+wSfJfq4w3OZAdF9V++NDQkQSrkpFgXlUp07DbAAdw/QUMbHfJEevQsx0dm1PKwzcUC5Ew6f7YYA==',
        },
      },
    )

    // Sleep for 2 seconds to allow the oracle to create the hotspot
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const hotspot = (
      await axios.get(
        `https://onboarding.oracle.test-helium.com/api/v2/hotspots/${onboardingKey}`,
      )
    ).data.data

    // Sleep for 2 seconds to allow the oracle to create the hotspot
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const result = await axios.post(
      `https://onboarding.oracle.test-helium.com/api/v2/transactions/pay/${onboardingKey}`,
      {
        transaction: (
          await new AddGatewayV1({
            owner: owner.address,
            gateway: gateway.address,
            payer: maker,
          }).sign({
            gateway,
          })
        ).toString(),
      },
    )

    const connection = new Connection('https://api.devnet.solana.com')
    // eslint-disable-next-line no-restricted-syntax
    for (const solanaTransaction of result.data.data.solanaTransactions) {
      // eslint-disable-next-line no-await-in-loop
      const { txid } = await sendAndConfirmWithRetry(
        connection,
        Buffer.from(solanaTransaction),
        { skipPreflight: true },
        'confirmed',
      )
    }
  }, [anchorProvider, currentAccount])

  useEffect(() => {
    if (!currentAccount?.solanaAddress) return

    refresh()

    const subId = onLogs(cluster, currentAccount?.solanaAddress, () => {
      refresh()
    })

    if (accountSubscriptionId.current !== undefined) {
      removeAccountChangeListener(cluster, accountSubscriptionId.current)
    }
    accountSubscriptionId.current = subId
  }, [cluster, currentAccount, dispatch, l1Network, refresh])

  if (
    !currentAccount?.solanaAddress ||
    !collectables[currentAccount?.solanaAddress]
  ) {
    return {
      loading: false,
      hotspots: [],
      hotspotsWithMeta: [],
      refresh,
      claimAllRewards: {
        execute,
        error,
        loading,
      },
      createHotspot,
    }
  }

  return {
    hotspots,
    hotspotsWithMeta:
      collectables[currentAccount?.solanaAddress].collectablesWithMeta
        .HOTSPOT || [],
    loading: collectables[currentAccount?.solanaAddress].loading,
    refresh,
    claimAllRewards: {
      execute,
      error,
      loading,
    },
    createHotspot,
  }
}
export default useHotspots
