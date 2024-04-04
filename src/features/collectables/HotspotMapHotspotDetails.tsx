import Hex from '@assets/images/hex.svg'
import Box from '@components/Box'
import ImageBox from '@components/ImageBox'
import ListItem from '@components/ListItem'
import Text from '@components/Text'
import { useHotspotAddress } from '@hooks/useHotspotAddress'
import { IotHotspotInfoV0 } from '@hooks/useIotInfo'
import { useMaker } from '@hooks/useMaker'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import { MobileHotspotInfoV0 } from '@hooks/useMobileInfo'
import { usePublicKey } from '@hooks/usePublicKey'
import { useColors } from '@theme/themeHooks'
import { ellipsizeAddress } from '@utils/accountUtils'
import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigation } from '@react-navigation/native'
import { HotspotWithPendingRewards } from '../../types/solana'
import { CollectableNavigationProp } from './collectablesTypes'

const IotMapDetails = ({
  maker,
  info,
}: {
  maker: string
  info: IotHotspotInfoV0
}) => {
  const colors = useColors()
  const { gain, elevation } = info

  return (
    <Box flexDirection="row" marginTop="m">
      <Box flex={1} flexDirection="row" justifyContent="space-between">
        <Box>
          <Text variant="body1Medium">Transmit Scale</Text>
          <Box flexDirection="row" alignItems="center">
            <Hex width={16} height={16} color={colors.darkGrey} />
            <Text marginLeft="s" variant="body1">
              ---
            </Text>
          </Box>
        </Box>
        <Box>
          <Text variant="body1Medium">Maker</Text>
          <Text variant="body1">{maker}</Text>
        </Box>
        <Box>
          <Text variant="body1Medium">Gain</Text>
          <Text variant="body1">{gain} dBi</Text>
        </Box>
        <Box>
          <Text variant="body1Medium">Elevation</Text>
          <Text variant="body1">{elevation}m</Text>
        </Box>
      </Box>
    </Box>
  )
}

const MobileMapDetails = ({
  maker,
  info,
}: {
  maker: string
  info: MobileHotspotInfoV0
}) => {
  const colors = useColors()
  const { deviceType } = info

  return (
    <Box flexDirection="row" marginTop="m">
      <Box flex={1} flexDirection="row" justifyContent="space-between">
        <Box>
          <Text variant="body1Medium">Coverage</Text>
          <Box flexDirection="row" alignItems="center">
            <Hex width={16} height={16} color={colors.darkGrey} />
            <Text marginLeft="s" variant="body1">
              ---
            </Text>
          </Box>
        </Box>
        <Box>
          <Text variant="body1Medium">Maker</Text>
          <Text variant="body1">{maker}</Text>
        </Box>
        <Box>
          <Text variant="body1Medium">Radio Type</Text>
          <Text variant="body1">{Object.keys(deviceType)[0]}</Text>
        </Box>
      </Box>
    </Box>
  )
}

export const HotspotMapHotspotDetails = ({
  hotspot,
  info,
  network,
}: {
  hotspot: HotspotWithPendingRewards
  info: IotHotspotInfoV0 | MobileHotspotInfoV0
  network: 'IOT' | 'MOBILE'
}) => {
  const { t } = useTranslation()
  const navigation = useNavigation<CollectableNavigationProp>()
  const streetAddress = useHotspotAddress(hotspot)
  const { metadata } = hotspot.content
  const collection = hotspot.grouping.find(
    (k) => k.group_key === 'collection',
  )?.group_value
  const collectionKey = usePublicKey(collection)
  const { metadata: mplxMetadata } = useMetaplexMetadata(collectionKey)
  const { loading, info: makerAcc } = useMaker(
    mplxMetadata?.updateAuthority.toBase58(),
  )
  const eccCompact = useMemo(() => {
    if (!metadata || !metadata?.attributes?.length) {
      return undefined
    }

    return metadata.attributes.find(
      (attr: any) => attr?.trait_type === 'ecc_compact',
    )?.value
  }, [metadata])

  const handleClaimRewards = useCallback(() => {
    navigation.navigate('ClaimRewardsScreen', {
      hotspot,
    })
  }, [hotspot, navigation])

  const handleTransfer = useCallback(() => {
    navigation.navigate('TransferCollectableScreen', {
      collectable: hotspot,
    })
  }, [hotspot, navigation])

  const handleAssertLocation = useCallback(() => {
    navigation.navigate('AssertLocationScreen', {
      collectable: hotspot,
    })
  }, [hotspot, navigation])

  const handleAntennaSetup = useCallback(() => {
    navigation.navigate('AntennaSetupScreen', {
      collectable: hotspot,
    })
  }, [hotspot, navigation])

  const handleMetadataPress = () => {
    if (metadata) {
      navigation.push('NftMetadataScreen', {
        metadata,
      })
    }
  }

  return (
    <>
      <Box padding="m" borderBottomColor="black900" borderBottomWidth={1}>
        <Box flexDirection="row">
          <ImageBox
            borderRadius="lm"
            height={60}
            width={60}
            mr="ms"
            source={{
              uri: metadata?.image,
              cache: 'force-cache',
            }}
          />
          <Box flex={1}>
            <Box flexDirection="row" alignItems="center">
              <Text
                variant="h3Bold"
                color="white"
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {hotspot.content.metadata.name}
              </Text>
            </Box>
            <Box
              flexDirection="row"
              justifyContent="space-between"
              alignItems="center"
            >
              {streetAddress && (
                <Text numberOfLines={1} variant="body1">
                  {streetAddress}
                </Text>
              )}
              <Box
                backgroundColor="surfaceContrast"
                height={6}
                width={6}
                borderRadius="round"
              />
              <Box>
                <Text variant="body1" numberOfLines={1}>
                  {eccCompact && ellipsizeAddress(eccCompact, { numChars: 4 })}
                </Text>
              </Box>
            </Box>
          </Box>
        </Box>
        {loading ? null : network === 'IOT' ? (
          <IotMapDetails
            maker={makerAcc?.name || 'Unknown'}
            info={info as IotHotspotInfoV0}
          />
        ) : (
          <MobileMapDetails
            maker={makerAcc?.name || 'Unknown'}
            info={info as MobileHotspotInfoV0}
          />
        )}
      </Box>
      <ListItem
        title="Claim Rewards"
        onPress={handleClaimRewards}
        selected={false}
        hasPressedState={false}
      />
      <ListItem
        title={t('collectablesScreen.hotspots.viewInExplorer')}
        onPress={() => console.log('test')}
        selected={false}
        hasPressedState={false}
      />
      <ListItem
        title="Transfer"
        onPress={handleTransfer}
        selected={false}
        hasPressedState={false}
      />
      <ListItem
        title={t('collectablesScreen.hotspots.assertLocation')}
        onPress={handleAssertLocation}
        selected={false}
        hasPressedState={false}
      />
      <ListItem
        title={t('collectablesScreen.hotspots.antennaSetup')}
        onPress={handleAntennaSetup}
        selected={false}
        hasPressedState={false}
      />
      <ListItem
        title="Show Metadata"
        onPress={handleMetadataPress}
        selected={false}
        hasPressedState={false}
        hasDivider={false}
      />
    </>
  )
}
