import IotSymbol from '@assets/images/iotSymbol.svg'
import MobileSymbol from '@assets/images/mobileSymbol.svg'
import { ReAnimatedBox } from '@components/AnimatedBox'
import Box from '@components/Box'
import ImageBox from '@components/ImageBox'
import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { useMint } from '@helium/helium-react-hooks'
import { IOT_MINT, MOBILE_MINT, toNumber } from '@helium/spl-utils'
import { useHotspotAddress } from '@hooks/useHotspotAddress'
import { BoxProps } from '@shopify/restyle'
import { Theme } from '@theme/theme'
import { ellipsizeAddress, formatLargeNumber } from '@utils/accountUtils'
import BigNumber from 'bignumber.js'
import BN from 'bn.js'
import React, { useMemo } from 'react'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { useColors, useOpacity } from '@theme/themeHooks'
import { PublicKey } from '@solana/web3.js'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import { useTranslation } from 'react-i18next'
import { HotspotWithPendingRewards } from '../../types/solana'
import { Mints } from '../../utils/constants'
import { removeDashAndCapitalize } from '../../utils/hotspotNftsUtils'

export type HotspotListItemProps = {
  hotspot: HotspotWithPendingRewards
  onPress: (hotspot: HotspotWithPendingRewards) => void
} & BoxProps<Theme>

const HotspotListItem = ({
  hotspot,
  onPress,
  ...rest
}: HotspotListItemProps) => {
  const {
    content: { metadata },
  } = hotspot
  const { t } = useTranslation()
  const colors = useColors()
  const wallet = useCurrentWallet()
  const { backgroundStyle: flamecoOpaque } = useOpacity('orange.500', 0.1)
  const streetAddress = useHotspotAddress(hotspot)

  const { info: iotMint } = useMint(IOT_MINT)
  const { info: mobileMint } = useMint(MOBILE_MINT)

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
    [hotspot.pendingRewards],
  )

  const pendingMobileRewardsString = useMemo(() => {
    if (!hotspot.pendingRewards) return
    const num = toNumber(
      new BN(hotspot.pendingRewards[Mints.MOBILE]),
      mobileMint?.decimals || 6,
    )
    return formatLargeNumber(new BigNumber(num))
  }, [hotspot, mobileMint])

  const eccCompact = useMemo(() => {
    if (!metadata || !metadata?.attributes?.length) {
      return undefined
    }

    return metadata.attributes.find(
      (attr: any) => attr?.trait_type === 'ecc_compact',
    )?.value
  }, [metadata])

  const hasIotRewards = useMemo(
    () => pendingIotRewards && pendingIotRewards.gt(new BN(0)),
    [pendingIotRewards],
  )
  const hasMobileRewards = useMemo(
    () => pendingMobileRewards && pendingMobileRewards.gt(new BN(0)),
    [pendingMobileRewards],
  )

  const mobileRecipient = useMemo(
    () => hotspot?.rewardRecipients?.[Mints.MOBILE],
    [hotspot],
  )

  const iotRecipient = useMemo(
    () => hotspot?.rewardRecipients?.[Mints.IOT],
    [hotspot],
  )

  const hasIotRecipient = useMemo(
    () =>
      iotRecipient?.destination &&
      wallet &&
      !new PublicKey(iotRecipient.destination).equals(wallet) &&
      !new PublicKey(iotRecipient.destination).equals(PublicKey.default),
    [iotRecipient, wallet],
  )

  const hasMobileRecipient = useMemo(
    () =>
      mobileRecipient?.destination &&
      wallet &&
      !new PublicKey(mobileRecipient.destination).equals(wallet) &&
      !new PublicKey(mobileRecipient.destination).equals(PublicKey.default),
    [mobileRecipient, wallet],
  )

  const hasRecipientSet = useMemo(
    () => hasIotRecipient || hasMobileRecipient,
    [hasIotRecipient, hasMobileRecipient],
  )

  return (
    <ReAnimatedBox
      backgroundColor="bg.tertiary"
      borderRadius="2xl"
      position="relative"
      entering={FadeIn}
      exiting={FadeOut}
      {...rest}
    >
      <TouchableOpacityBox
        flex={1}
        padding="3"
        paddingTop="2"
        onPress={() => onPress(hotspot)}
      >
        {hasRecipientSet && (
          <Box flexDirection="row" alignItems="center">
            <Box
              flexDirection="row"
              justifyContent="space-between"
              alignItems="center"
              borderRadius="2xl"
              paddingVertical="1.5"
              paddingLeft="2"
              paddingRight="2"
              style={{
                ...flamecoOpaque,
              }}
            >
              <Text variant="textXsMedium" color="orange.500">
                {t('changeRewardsRecipientScreen.set')}
              </Text>
            </Box>
          </Box>
        )}
        <Box flex={1} flexDirection="row" alignItems="center">
          <ImageBox
            borderRadius="2xl"
            height={72}
            width={62}
            source={{
              uri: metadata?.image,
              cache: 'force-cache',
            }}
          />
          <Box marginLeft="3" flex={1}>
            {metadata?.name && (
              <Text
                textAlign="left"
                variant="textLgMedium"
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {removeDashAndCapitalize(metadata.name)}
              </Text>
            )}

            {streetAddress && (
              <Text
                variant="textSmRegular"
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {streetAddress}
              </Text>
            )}
            <Text
              variant="textMdMedium"
              color="secondaryText"
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {eccCompact ? ellipsizeAddress(eccCompact) : ''}
            </Text>
          </Box>
          <Box marginLeft="3">
            {!!hasMobileRewards && (
              <Box
                flexDirection="row"
                justifyContent="space-between"
                alignItems="center"
                backgroundColor="mobileDarkBlue"
                borderRadius="2xl"
                paddingVertical="xs"
                paddingLeft="xs"
                paddingRight="2"
                marginBottom="xs"
              >
                <MobileSymbol
                  color={colors.mobileBlue}
                  width={20}
                  height={20}
                />
                <Text variant="textXsMedium" marginLeft="xs" color="mobileBlue">
                  {pendingMobileRewardsString}
                </Text>
              </Box>
            )}
            {!!hasIotRewards && (
              <Box
                flexDirection="row"
                justifyContent="space-between"
                alignItems="center"
                backgroundColor="iotDarkGreen"
                borderRadius="2xl"
                paddingVertical="xs"
                paddingLeft="xs"
                paddingRight="2"
              >
                <IotSymbol color={colors.iotGreen} width={20} height={20} />
                <Text variant="textXsMedium" marginLeft="xs" color="iotGreen">
                  {pendingIotRewardsString}
                </Text>
              </Box>
            )}
          </Box>
        </Box>
      </TouchableOpacityBox>
    </ReAnimatedBox>
  )
}

export default HotspotListItem
