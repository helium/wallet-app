/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { init } from '@helium/lazy-distributor-sdk'
import * as client from '@helium/distributor-oracle'
import { PublicKey } from '@solana/web3.js'
import { useAsyncCallback } from 'react-async-hook'
import axios from 'axios'
import { AddGatewayV1 } from '@helium/transactions'
import Address from '@helium/address'
import { Keypair } from '@helium/crypto'
import { sendAndConfirmWithRetry } from '@helium/spl-utils'
// import Config from 'react-native-config'
import { getKeypair } from '../storage/secureStorage'
import { useAccountStorage } from '../storage/AccountStorageProvider'
import { useAppStorage } from '../storage/AppStorageProvider'
import { RootState } from '../store/rootReducer'
import { fetchHotspots, fetchMoreHotspots } from '../store/slices/hotspotsSlice'
import { useAppDispatch } from '../store/store'
import { getConnection } from '../utils/solanaUtils'
import { CompressedNFT } from '../types/solana'
import { MOBILE_LAZY_KEY, IOT_LAZY_KEY } from '../utils/hotspotNftsUtils'
import useSubmitTxn from '../graphql/useSubmitTxn'
import * as Logger from '../utils/logger'

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
  claimAllMobileRewards: {
    loading: boolean
    error: Error | undefined
    execute: () => Promise<void>
  }
  claimAllIotRewards: {
    loading: boolean
    error: Error | undefined
    execute: () => Promise<void>
  }
  pendingIotRewards: number
  pendingMobileRewards: number
  createHotspot: () => Promise<void>
  fetchMore: () => void
  fetchingMore: boolean
} => {
  const { solanaNetwork: cluster, l1Network } = useAppStorage()
  const dispatch = useAppDispatch()
  const { currentAccount, anchorProvider } = useAccountStorage()
  const hotspotsSlice = useSelector((state: RootState) => state.hotspots)
  const { submitClaimAllRewards } = useSubmitTxn()

  const page = useMemo(() => {
    if (
      !currentAccount?.solanaAddress ||
      !hotspotsSlice[currentAccount?.solanaAddress]
    )
      return 0
    return hotspotsSlice[currentAccount?.solanaAddress].page
  }, [hotspotsSlice, currentAccount])

  const hotspots = useMemo(() => {
    if (!currentAccount?.solanaAddress) return []

    return hotspotsSlice[currentAccount?.solanaAddress]?.hotspots || []
  }, [hotspotsSlice, currentAccount])

  const onClaimAllMobileRewards = async () => {
    if (!anchorProvider || !currentAccount?.solanaAddress) {
      return
    }
    const program = await init(anchorProvider)
    const wallet = new PublicKey(currentAccount?.solanaAddress)

    const txns = await Promise.all(
      hotspots.map(async (nft: CompressedNFT) => {
        const rewards = await client.getCurrentRewards(
          program as any,
          MOBILE_LAZY_KEY,
          new PublicKey(nft.id),
        )

        return client.formTransaction({
          program: program as any,
          provider: anchorProvider,
          rewards,
          hotspot: new PublicKey(nft.id),
          lazyDistributor: MOBILE_LAZY_KEY,
          wallet,
        })
      }),
    )

    await submitClaimAllRewards(txns)
  }

  const onClaimAllIotRewards = async () => {
    if (!anchorProvider || !currentAccount?.solanaAddress) {
      return
    }
    const program = await init(anchorProvider)
    const wallet = new PublicKey(currentAccount?.solanaAddress)

    const txns = await Promise.all(
      hotspots.map(async (nft: CompressedNFT) => {
        const rewards = await client.getCurrentRewards(
          program as any,
          IOT_LAZY_KEY,
          new PublicKey(nft.id),
        )

        return client.formTransaction({
          program: program as any,
          provider: anchorProvider,
          rewards,
          hotspot: new PublicKey(nft.id),
          lazyDistributor: IOT_LAZY_KEY,
          wallet,
        })
      }),
    )

    await submitClaimAllRewards(txns)
  }

  const { execute, loading, error } = useAsyncCallback(onClaimAllMobileRewards)
  const {
    execute: executeIot,
    loading: loadingIot,
    error: errorIot,
  } = useAsyncCallback(onClaimAllIotRewards)

  const refresh = useCallback(() => {
    if (!currentAccount?.solanaAddress || l1Network !== 'solana') {
      return
    }
    dispatch(
      fetchHotspots({
        account: currentAccount,
        cluster,
      }),
    )
  }, [cluster, currentAccount, dispatch, l1Network])

  const fetchingMore = useMemo(() => {
    if (
      !currentAccount?.solanaAddress ||
      !hotspotsSlice[currentAccount?.solanaAddress]
    )
      return false

    return hotspotsSlice[currentAccount?.solanaAddress].fetchingMore
  }, [hotspotsSlice, currentAccount])

  const fetchMore = useCallback(() => {
    if (
      !currentAccount?.solanaAddress ||
      l1Network !== 'solana' ||
      hotspotsSlice[currentAccount?.solanaAddress].loading
    ) {
      return
    }
    dispatch(
      fetchMoreHotspots({
        account: currentAccount,
        cluster,
        page,
      }),
    )
  }, [cluster, hotspotsSlice, currentAccount, dispatch, l1Network, page])

  // FOR TESTING ONLY
  const createHotspot = useCallback(async () => {
    if (!currentAccount || !anchorProvider || !currentAccount.solanaAddress)
      return

    const secureStorage = await getKeypair(currentAccount.address)
    if (!secureStorage) return

    const owner = new Keypair(secureStorage.keypair)
    const gateway = await Keypair.makeRandom()
    const onboardingKey = gateway.address.b58
    // Random maker address
    const maker = Address.fromB58(
      '14neTgRNZui1hSiHgE3LXjSfwkPU8BEB192MLXXDFnSY2xKjH51',
    )

    const url = 'https://onboarding.web.test-helium.com/api'

    try {
      await axios.post(
        `${url}/v3/hotspots`,
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
              'pk_TgclExRP7rEXAEQlSgrrDwaZUHJAPcw/nNfkEpWOPCk=:sk_E1xc9OVq1/5oKLGD4RzxST7bl+LMnJhalkQ3vZp/QbOjNltvAmHyPolzA0Pb2HyTD68mZp4lETuC19Y+vI72nA=',
          },
        },
      )

      // Sleep for 2 seconds to allow the oracle to create the hotspot
      await new Promise((resolve) => setTimeout(resolve, 2000))

      await axios.get(`${url}/v3/hotspots/${onboardingKey}`)

      // Sleep for 2 seconds to allow the oracle to create the hotspot
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const result = await axios.post(`${url}/v3/transactions/create-hotspot`, {
        transaction: (
          await new AddGatewayV1({
            owner: owner.address,
            gateway: gateway.address,
            payer: maker,
          }).sign({
            gateway,
          })
        ).toString(),
      })

      const connection = getConnection(cluster)
      // eslint-disable-next-line no-restricted-syntax
      for (const solanaTransaction of result.data.data.solanaTransactions) {
        // eslint-disable-next-line no-await-in-loop
        await sendAndConfirmWithRetry(
          connection,
          Buffer.from(solanaTransaction),
          { skipPreflight: true },
          'confirmed',
        )
      }
    } catch (e) {
      Logger.error(e)
    }
  }, [anchorProvider, cluster, currentAccount])

  const pendingIotRewards = useMemo(() => {
    if (!currentAccount?.solanaAddress) return 0

    let total = 0
    const walletHotspots =
      hotspotsSlice[currentAccount?.solanaAddress]?.hotspotDetails

    if (!walletHotspots) return 0

    Object.keys(walletHotspots).forEach((hotspot) => {
      const hotspotDetails = walletHotspots[hotspot]
      total += hotspotDetails?.pendingIotRewards || 0
    })

    return total
  }, [hotspotsSlice, currentAccount])

  const pendingMobileRewards = useMemo(() => {
    if (!currentAccount?.solanaAddress) return 0

    let total = 0
    const walletHotspots =
      hotspotsSlice[currentAccount?.solanaAddress]?.hotspotDetails

    if (!walletHotspots) return 0

    Object.keys(walletHotspots).forEach((hotspot) => {
      const hotspotDetails = walletHotspots[hotspot]
      total += hotspotDetails?.pendingMobileRewards || 0
    })

    return total
  }, [hotspotsSlice, currentAccount])

  if (
    !currentAccount?.solanaAddress ||
    !hotspotsSlice[currentAccount?.solanaAddress]
  ) {
    return {
      loading: false,
      hotspots: [],
      hotspotsWithMeta: [],
      refresh,
      claimAllMobileRewards: {
        execute,
        error,
        loading,
      },
      claimAllIotRewards: {
        execute: executeIot,
        error: errorIot,
        loading: loadingIot,
      },
      pendingIotRewards,
      pendingMobileRewards,
      createHotspot,
      fetchMore,
      fetchingMore,
    }
  }

  return {
    hotspots,
    hotspotsWithMeta:
      hotspotsSlice[currentAccount?.solanaAddress]?.hotspotsWithMeta,
    loading: hotspotsSlice[currentAccount?.solanaAddress].loading,
    refresh,
    claimAllMobileRewards: {
      execute,
      error,
      loading,
    },
    claimAllIotRewards: {
      execute: executeIot,
      error: errorIot,
      loading: loadingIot,
    },
    pendingIotRewards,
    pendingMobileRewards,
    createHotspot,
    fetchMore,
    fetchingMore,
  }
}
export default useHotspots
