import Hex from '@assets/images/hex.svg'
import IotSymbol from '@assets/images/iotSymbol.svg'
import MobileSymbol from '@assets/images/mobileSymbol.svg'
import Box from '@components/Box'
import ImageBox from '@components/ImageBox'
import ListItem from '@components/ListItem'
import Text from '@components/Text'
import TouchableContainer from '@components/TouchableContainer'
import { useMint } from '@helium/helium-react-hooks'
import { IOT_MINT, MOBILE_MINT, toNumber } from '@helium/spl-utils'
import { useEntityKey } from '@hooks/useEntityKey'
import { getExplorerUrl, useExplorer } from '@hooks/useExplorer'
import { useHotspotAddress } from '@hooks/useHotspotAddress'
import { IotHotspotInfoV0 } from '@hooks/useIotInfo'
import { useMaker } from '@hooks/useMaker'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import { MobileHotspotInfoV0 } from '@hooks/useMobileInfo'
import { usePublicKey } from '@hooks/usePublicKey'
import { useNavigation } from '@react-navigation/native'
import { useColors } from '@theme/themeHooks'
import { ellipsizeAddress, formatLargeNumber } from '@utils/accountUtils'
import { Explorer } from '@utils/walletApiV2'
import BigNumber from 'bignumber.js'
import BN from 'bn.js'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Linking } from 'react-native'
import { SvgUri } from 'react-native-svg'
import { HotspotWithPendingRewards } from '../../types/solana'
import { Mints } from '../../utils/constants'
import { CollectableNavigationProp } from './collectablesTypes'

const IotMapDetails = ({
  maker,
  info,
}: {
  maker: string
  info: IotHotspotInfoV0
}) => {
  const { t } = useTranslation()
  const colors = useColors()
  const { gain, elevation } = info

  return (
    <Box flexDirection="row" marginTop="m">
      <Box flex={1} flexDirection="row" justifyContent="space-between">
        <Box>
          <Text variant="body1Medium">
            {t('collectablesScreen.hotspots.map.transmitScale')}
          </Text>
          <Box flexDirection="row" alignItems="center">
            <Hex width={16} height={16} color={colors.darkGrey} />
            <Text marginLeft="s" variant="body1">
              ---
            </Text>
          </Box>
        </Box>
        <Box>
          <Text variant="body1Medium">{t('generic.maker')}</Text>
          <Text variant="body1">{maker}</Text>
        </Box>
        <Box>
          <Text variant="body1Medium">{t('generic.gain')}</Text>
          <Text variant="body1">
            {gain} {t('generic.dBi')}
          </Text>
        </Box>
        <Box>
          <Text variant="body1Medium">{t('generic.elevation')}</Text>
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
  const { t } = useTranslation()
  const colors = useColors()
  const { deviceType } = info

  return (
    <Box flexDirection="row" marginTop="m">
      <Box flex={1} flexDirection="row" justifyContent="space-between">
        <Box>
          <Text variant="body1Medium">{t('generic.coverage')}</Text>
          <Box flexDirection="row" alignItems="center">
            <Hex width={16} height={16} color={colors.darkGrey} />
            <Text marginLeft="s" variant="body1">
              ---
            </Text>
          </Box>
        </Box>
        <Box>
          <Text variant="body1Medium">{t('generic.maker')}</Text>
          <Text variant="body1">{maker}</Text>
        </Box>
        <Box>
          <Text variant="body1Medium">{t('generic.radioType')}</Text>
          <Text variant="body1">
            {deviceType ? Object.keys(deviceType)[0] : '---'}
          </Text>
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
  const entityKey = useEntityKey(hotspot)
  const [selectExplorerOpen, setSelectExplorerOpen] = useState(false)
  const streetAddress = useHotspotAddress(hotspot)
  const { info: iotMint } = useMint(IOT_MINT)
  const { info: mobileMint } = useMint(MOBILE_MINT)
  const { metadata } = hotspot.content
  const collection = hotspot.grouping.find(
    (k) => k.group_key === 'collection',
  )?.group_value
  const collectionKey = usePublicKey(collection)

  const { loading: mplxLoading, metadata: mplxMetadata } =
    useMetaplexMetadata(collectionKey)

  const {
    loading: explorerLoading,
    current: explorer,
    explorers: available,
    updateExplorer,
  } = useExplorer()

  const { loading: makerLoading, info: makerAcc } = useMaker(
    mplxMetadata?.updateAuthority.toBase58(),
  )

  const pendingIotRewards = useMemo(
    () => hotspot.pendingRewards && new BN(hotspot.pendingRewards[Mints.IOT]),
    [hotspot],
  )

  const pendingIotRewardsString = useMemo(() => {
    if (!hotspot.pendingRewards) return
    const num = toNumber(
      new BN(hotspot.pendingRewards[Mints.IOT]),
      iotMint?.decimals || 6,
    )
    return formatLargeNumber(new BigNumber(num))
  }, [hotspot, iotMint])

  const pendingMobileRewards = useMemo(
    () =>
      hotspot.pendingRewards && new BN(hotspot.pendingRewards[Mints.MOBILE]),
    [hotspot],
  )

  const pendingMobileRewardsString = useMemo(() => {
    if (!hotspot.pendingRewards) return
    const num = toNumber(
      new BN(hotspot.pendingRewards[Mints.MOBILE]),
      mobileMint?.decimals || 6,
    )
    return formatLargeNumber(new BigNumber(num))
  }, [hotspot, mobileMint])

  const hasIotRewards = useMemo(
    () => pendingIotRewards && pendingIotRewards.gt(new BN(0)),
    [pendingIotRewards],
  )
  const hasMobileRewards = useMemo(
    () => pendingMobileRewards && pendingMobileRewards.gt(new BN(0)),
    [pendingMobileRewards],
  )

  const hasRewards = useMemo(
    () => hasIotRewards || hasMobileRewards,
    [hasIotRewards, hasMobileRewards],
  )

  const isLoading = useMemo(
    () => mplxLoading || explorerLoading || makerLoading,
    [mplxLoading, explorerLoading, makerLoading],
  )

  const eccCompact = useMemo(() => {
    if (!metadata || !metadata?.attributes?.length) {
      return undefined
    }

    return metadata.attributes.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (attr: any) => attr?.trait_type === 'ecc_compact',
    )?.value
  }, [metadata])

  useEffect(() => {
    if (explorer) {
      setSelectExplorerOpen(false)
    }
  }, [explorer])

  const handleViewInExplorer = useCallback(async () => {
    if (explorer && entityKey) {
      const url = getExplorerUrl({ entityKey, explorer })
      await Linking.openURL(url)
    } else if (entityKey) {
      setSelectExplorerOpen(true)
    }
  }, [explorer, entityKey, setSelectExplorerOpen])

  const handleConfirmExplorer = useCallback(
    async (selectedExplorer: string) => {
      await updateExplorer(selectedExplorer)

      const selected = available?.find(
        (a: Explorer) => a.value === selectedExplorer,
      )
      if (entityKey && selected) {
        const url = getExplorerUrl({
          entityKey,
          explorer: selected,
        })
        await Linking.openURL(url)
      }
    },
    [available, entityKey, updateExplorer],
  )

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

  if (isLoading) return null

  return (
    <>
      <Box padding="ms" borderBottomColor="black900" borderBottomWidth={1}>
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
        {isLoading ? null : network === 'IOT' ? (
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
      {selectExplorerOpen ? (
        <>
          <Box borderBottomColor="black900" padding="m" borderBottomWidth={1}>
            <Text variant="subtitle1">
              {t('activityScreen.selectExplorer')}
            </Text>

            <Text variant="body2">
              {t('activityScreen.selectExplorerSubtitle')}
            </Text>
          </Box>

          {available?.map((a) => {
            return (
              <ListItem
                key={a.value}
                title={a.label}
                Icon={
                  a.image.endsWith('svg') ? (
                    <SvgUri height={16} width={16} uri={a.image} />
                  ) : (
                    <ImageBox
                      height={16}
                      width={16}
                      source={{ uri: a.image }}
                    />
                  )
                }
                onPress={() => handleConfirmExplorer(a.value)}
                selected={explorer?.value === a.value}
                hasPressedState={false}
              />
            )
          })}
        </>
      ) : (
        <>
          <TouchableContainer
            alignItems="center"
            flex={1}
            flexDirection="row"
            paddingVertical="m"
            borderBottomColor="black900"
            borderBottomWidth={1}
            onPress={hasRewards ? handleClaimRewards : undefined}
            disabled={!hasRewards}
          >
            <Box
              flex={1}
              flexDirection="row"
              alignItems="center"
              marginHorizontal="m"
            >
              <Text variant="subtitle3" opacity={!hasRewards ? 0.5 : 1}>
                {t('collectablesScreen.hotspots.claimRewards')}
              </Text>
              <Box
                flex={1}
                flexDirection="row"
                justifyContent="flex-end"
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                gap={4}
              >
                <Box
                  justifyContent="center"
                  alignItems="center"
                  backgroundColor="iotDarkGreen"
                  borderRadius="xl"
                  padding="xs"
                  paddingRight="s"
                  flexDirection="row"
                >
                  <IotSymbol color="black" />
                  <Text variant="body2Medium" marginLeft="s" color="iotGreen">
                    {pendingIotRewardsString}
                  </Text>
                </Box>
                <Box
                  justifyContent="center"
                  alignItems="center"
                  backgroundColor="mobileDarkBlue"
                  borderRadius="xl"
                  padding="xs"
                  paddingRight="s"
                  flexDirection="row"
                >
                  <MobileSymbol color="black" />
                  <Text variant="body2Medium" marginLeft="s" color="mobileBlue">
                    {pendingMobileRewardsString}
                  </Text>
                </Box>
              </Box>
            </Box>
          </TouchableContainer>
          <ListItem
            title={t('collectablesScreen.hotspots.viewInExplorer')}
            onPress={handleViewInExplorer}
            selected={false}
            hasPressedState={false}
          />
          <ListItem
            title={t('collectablesScreen.hotspots.transferHotspot')}
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
          {network === 'IOT' && (
            <ListItem
              title={t('collectablesScreen.hotspots.antennaSetup')}
              onPress={handleAntennaSetup}
              selected={false}
              hasPressedState={false}
            />
          )}
          <ListItem
            title={t('collectablesScreen.hotspots.showMetadata')}
            onPress={handleMetadataPress}
            selected={false}
            hasPressedState={false}
            hasDivider={false}
          />
        </>
      )}
    </>
  )
}
