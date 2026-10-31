import { keyToAssetKey } from '@helium/helium-entity-manager-sdk'
import { useHotspotBle } from '@helium/react-native-sdk'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import { useIotInfo } from '@hooks/useIotInfo'
import { useKeyToAsset } from '@hooks/useKeyToAsset'
import { useNavigation } from '@react-navigation/native'
import { PublicKey } from '@solana/web3.js'
import { useAccountStorage } from '@storage/AccountStorageProvider'
import { DAO_KEY } from '@utils/constants'
import { getHotspotWithRewards } from '@utils/solanaUtils'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@ui/Button'
import { PressableScale } from '@ui/PressableScale'
import { Text } from '@ui/Text'
import { Plus } from 'lucide-react-native'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, View } from 'react-native'
import { withUniwind } from 'uniwind'
import { useSolana } from '../../../solana/SolanaProvider'
import { CollectableNavigationProp } from '../../collectables/collectablesTypes'
import OnboardingScreen from '../components/OnboardingScreen'
import type { HotspotBLEStackParamList, HotspotBleNavProp } from './navTypes'

const PlusIcon = withUniwind(Plus)

type Option = {
  name: string
  route: Extract<keyof HotspotBLEStackParamList, 'WifiSettings' | 'Diagnostics'>
}

const data: Option[] = [
  {
    name: 'Wifi Settings',
    route: 'WifiSettings',
  },
  {
    name: 'Diagnostics',
    route: 'Diagnostics',
  },
]

// For testing "fresh" hotspots
// export const TEST_HOTSPOT_WORDS = [

// ]
// let TEST_HOTSPOT: Keypair = null
// async function setTestHotspot() {
//   TEST_HOTSPOT = await Keypair.fromMnemonic(new Mnemonic(TEST_HOTSPOT_WORDS))
// }
// setTestHotspot()
// export function getTestHotspot() {
//   return TEST_HOTSPOT!
// }

const Settings = () => {
  const navigation = useNavigation<HotspotBleNavProp>()
  const collectNav = useNavigation<CollectableNavigationProp>()
  const { t } = useTranslation()
  const {
    isConnected,
    getOnboardingAddress,
    createGatewayTxn: getCreateGatewayTxn,
  } = useHotspotBle()
  const [connected, setConnected] = useState(false)
  const { anchorProvider } = useSolana()
  const wallet = useCurrentWallet()
  const { currentAccount } = useAccountStorage()

  useEffect(() => {
    void isConnected().then(setConnected)
  }, [isConnected])
  const {
    data: { address, keyToAssetK, createGatewayTx } = {} as {
      address?: string
      keyToAssetK?: PublicKey
      createGatewayTx?: string
    },
    isLoading: loadingAddress,
    error,
  } = useQuery({
    queryKey: ['hotspotOnboardingAddress', connected, currentAccount?.address],
    queryFn: async (): Promise<{
      address?: string
      keyToAssetK?: PublicKey
      createGatewayTx?: string
    }> => {
      const accountAddress = currentAccount?.address
      if (connected && accountAddress) {
        const addr = await getOnboardingAddress()
        const tx = await getCreateGatewayTxn({
          ownerAddress: accountAddress,
          payerAddress: accountAddress,
        })
        // For testing
        // const addr = TEST_HOTSPOT.address.b58
        return {
          address: addr,
          keyToAssetK: keyToAssetKey(DAO_KEY, addr, 'b58')[0],
          createGatewayTx: tx,
        }
      }
      return {}
    },
    // A device read: never retry, and drop it on unmount so the next hotspot
    // does not see this one's address
    retry: false,
    gcTime: 0,
  })
  const { info: iotInfo, loading: loadingInfo } = useIotInfo(address)
  const { info: keyToAsset, loading: loadingKta } = useKeyToAsset(
    keyToAssetK?.toBase58(),
  )
  const loading = loadingInfo || loadingAddress || loadingKta

  const navNext = async () => {
    if (iotInfo && keyToAsset && anchorProvider && wallet) {
      const collectable = await getHotspotWithRewards(
        keyToAsset.asset,
        anchorProvider,
      )

      if (collectable.ownership.owner.toString() !== wallet.toBase58()) {
        collectNav.push('CollectablesTopTab')
      }

      collectNav.push('HotspotMapScreen', {
        hotspot: collectable,
        network: 'IOT',
      })
    } else {
      navigation.push('AddGatewayBle', {
        onboardingAddress: address!,
        createGatewayTx,
        network: 'IOT',
      })
    }
  }

  const renderItem = ({ item, index }: { item: Option; index: number }) => {
    return (
      <PressableScale
        onPress={() => {
          if (item.route === 'WifiSettings') {
            navigation.push('WifiSettings', {})
          } else {
            navigation.push('Diagnostics')
          }
        }}
        feedback="opacity"
        className={`flex-row items-center border-b border-border p-6 ${
          index === 0 ? '' : 'border-t'
        }`}
      >
        <View className="mr-3 size-[30px] items-center justify-center rounded-full bg-secondary">
          <PlusIcon size={16} colorClassName="accent-foreground" />
        </View>
        <Text size="xl" className="font-medium text-muted-foreground">
          {item.name}
        </Text>
      </PressableScale>
    )
  }

  const keyExtractor = (option: Option) => option.name
  let errorMessage = error?.message
    ? error?.message.toString()
    : error?.toString()
  if (errorMessage === 'wait') {
    errorMessage = t('hotspotOnboarding.settings.notReady')
  }

  return (
    <OnboardingScreen title={t('hotspotOnboarding.settings.title')}>
      <FlatList
        contentInsetAdjustmentBehavior="automatic"
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
      />
      {error && (
        <Text size="base" className="font-medium text-destructive">
          {t('hotspotOnboarding.settings.hotspotError')}
          {errorMessage}
        </Text>
      )}
      {!loadingInfo && !loadingKta && (
        <Button
          variant="cta"
          size="lg"
          className="mt-6 w-full"
          disabled={loading || !!error || !address}
          onPress={() => void navNext().catch(console.error)}
        >
          {iotInfo ? t('generic.done') : t('generic.next')}
        </Button>
      )}
    </OnboardingScreen>
  )
}

export default Settings
