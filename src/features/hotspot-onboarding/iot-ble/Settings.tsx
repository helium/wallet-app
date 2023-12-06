import BackScreen from '@components/BackScreen'
import ButtonPressable from '@components/ButtonPressable'
import FabButton from '@components/FabButton'
import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { keyToAssetKey } from '@helium/helium-entity-manager-sdk'
import { useHotspotBle } from '@helium/react-native-sdk'
import { useIotInfo } from '@hooks/useIotInfo'
import { useKeyToAsset } from '@hooks/useKeyToAsset'
import { PublicKey } from '@metaplex-foundation/js'
import { useNavigation } from '@react-navigation/native'
import { DAO_KEY } from '@utils/constants'
import React, { useCallback, useEffect, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { FlatList } from 'react-native'
import { CollectableNavigationProp } from '../../collectables/collectablesTypes'
import type { HotspotBLEStackParamList, HotspotBleNavProp } from './navTypes'
import { Keypair, Mnemonic } from '@helium/crypto'

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

export const TEST_HOTSPOT_WORDS = [
  'give',
  'example',
  'tag',
  'boil',
  'load',
  'over',
  'device',
  'hamster',
  'river',
  'soft',
  'cliff',
  'casual',
]
let TEST_HOTSPOT: Keypair = null

async function setTestHotspot() {
  TEST_HOTSPOT = await Keypair.fromMnemonic(new Mnemonic(TEST_HOTSPOT_WORDS))
}
setTestHotspot()

export function getTestHotspot() {
  return TEST_HOTSPOT!
}

const Settings = () => {
  const navigation = useNavigation<HotspotBleNavProp>()
  const collectNav = useNavigation<CollectableNavigationProp>()
  const { t } = useTranslation()
  const { getOnboardingAddress, isConnected } = useHotspotBle()
  const [connected, setConnected] = useState(false)

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
        // TODO: FIx when done dbugging
        // const addr = await getOnboardingAddress()
        const addr = TEST_HOTSPOT.address.b58
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
    if (iotInfo && keyToAsset) {
      const collectable = await getHotspotWithRewards(
        keyToAsset.asset,
        anchorProvider,
      )

      collectNav.push('HotspotDetailsScreen', { collectable })
    } else {
      navigation.push('AddGatewayBle')
    }
  }, [navigation, iotInfo, keyToAsset, collectNav])

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
      {!loadingInfo && (
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
