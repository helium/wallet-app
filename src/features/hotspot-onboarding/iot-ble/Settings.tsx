import BackScreen from '@components/BackScreen'
import ButtonPressable from '@components/ButtonPressable'
import FabButton from '@components/FabButton'
import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { keyToAssetKey } from '@helium/helium-entity-manager-sdk'
import { useHotspotBle } from '@helium/react-native-sdk'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import { useIotInfo } from '@hooks/useIotInfo'
import { useKeyToAsset } from '@hooks/useKeyToAsset'
import { PublicKey } from '@metaplex-foundation/js'
import { useNavigation } from '@react-navigation/native'
import { DAO_KEY } from '@utils/constants'
import { getHotspotWithRewards } from '@utils/solanaUtils'
import React, { useCallback, useEffect, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { FlatList } from 'react-native'
import { useSolana } from '../../../solana/SolanaProvider'
import { CollectableNavigationProp } from '../../collectables/collectablesTypes'
import type { HotspotBLEStackParamList, HotspotBleNavProp } from './navTypes'

type Option = {
  name: string
  route: keyof HotspotBLEStackParamList
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
  const { isConnected, getOnboardingAddress } = useHotspotBle()
  const [connected, setConnected] = useState(false)
  const { anchorProvider } = useSolana()
  const wallet = useCurrentWallet()

  useEffect(() => {
    isConnected().then(setConnected)
  }, [isConnected])
  const {
    result: { address, keyToAssetK } = {} as {
      address?: string
      keyToAssetK?: PublicKey
    },
    loading: loadingAddress,
  } = useAsync(
    async (
      c: boolean,
    ): Promise<{ address?: string; keyToAssetK?: PublicKey }> => {
      if (c) {
        const addr = await getOnboardingAddress()
        // For testing
        // const addr = TEST_HOTSPOT.address.b58
        return {
          address: addr,
          keyToAssetK: keyToAssetKey(DAO_KEY, addr, 'b58')[0],
        }
      }
      return {}
    },
    [connected],
  )
  const { info: iotInfo, loading: loadingInfo } = useIotInfo(address)
  const { info: keyToAsset, loading: loadingKta } = useKeyToAsset(
    keyToAssetK?.toBase58(),
  )
  const loading = loadingInfo || loadingAddress || loadingKta

  const navNext = useCallback(async () => {
    if (iotInfo && keyToAsset && anchorProvider && wallet) {
      const collectable = await getHotspotWithRewards(
        keyToAsset.asset,
        anchorProvider,
      )
      if (collectable.ownership.owner.toString() !== wallet.toBase58()) {
        collectNav.push('CollectablesTopTab')
      }

      collectNav.push('HotspotDetailsScreen', { collectable })
    } else {
      navigation.push('AddGatewayBle')
    }
  }, [anchorProvider, navigation, iotInfo, keyToAsset, collectNav, wallet])

  const renderItem = React.useCallback(
    // eslint-disable-next-line react/no-unused-prop-types
    ({ item, index }: { item: Option; index: number }) => {
      return (
        <TouchableOpacityBox
          onPress={() => {
            navigation.push(item.route, {})
          }}
          alignItems="center"
          padding="l"
          flexDirection="row"
          borderTopWidth={index === 0 ? 0 : 1}
          borderColor="grey900"
          borderBottomWidth={1}
        >
          <FabButton
            icon="add"
            backgroundColor="secondary"
            iconColor="white"
            size={30}
            disabled
            marginRight="ms"
          />
          <Text color="secondaryText" variant="subtitle1">
            {item.name}
          </Text>
        </TouchableOpacityBox>
      )
    },
    [navigation],
  )

  const keyExtractor = useCallback((option: Option) => option.name, [])

  return (
    <BackScreen title={t('hotspotOnboarding.settings.title')}>
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
      />
      {!loadingInfo && !loadingKta && (
        <ButtonPressable
          marginTop="l"
          borderRadius="round"
          titleColor="black"
          borderColor="transparent"
          backgroundColor="white"
          disabled={loading}
          title={iotInfo ? t('generic.done') : t('generic.next')}
          onPress={navNext}
        />
      )}
    </BackScreen>
  )
}

export default Settings
