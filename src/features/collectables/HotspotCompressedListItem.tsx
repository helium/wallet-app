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
import { useColors } from '@theme/themeHooks'
import { PublicKey } from '@solana/web3.js'
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
  const colors = useColors()
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
    () => hotspot.rewardRecipients?.[Mints.MOBILE],
    [hotspot.rewardRecipients],
  )

  const iotRecipient = useMemo(
    () => hotspot.rewardRecipients?.[Mints.IOT],
    [hotspot.rewardRecipients],
  )

  const hasIotRecipient = useMemo(
    () =>
      iotRecipient?.destination &&
      !iotRecipient.destination.equals(PublicKey.default),
    [iotRecipient],
  )

  const hasMobileRecipient = useMemo(
    () =>
      mobileRecipient?.destination &&
      !mobileRecipient.destination.equals(PublicKey.default),
    [mobileRecipient],
  )

  const recipientsAreDifferent = useMemo(
    () =>
      iotRecipient?.destination &&
      mobileRecipient?.destination &&
      !iotRecipient?.destination.equals(mobileRecipient?.destination),
    [iotRecipient, mobileRecipient],
  )

  return (
    <ReAnimatedBox
      backgroundColor="surfaceSecondary"
      borderRadius="l"
      position="relative"
      entering={FadeIn}
      exiting={FadeOut}
      {...rest}
    >
      <TouchableOpacityBox onPress={() => onPress(hotspot)}>
        <Box
          flex={1}
          flexDirection="row"
          alignItems="center"
          paddingHorizontal="m"
          paddingVertical="ms"
        >
          <ImageBox
            borderRadius="lm"
            height={72}
            width={62}
            source={{
              uri: metadata?.image,
              cache: 'force-cache',
            }}
          />
          <Box marginLeft="ms" flex={1}>
            {metadata?.name && (
              <Text
                textAlign="left"
                variant="subtitle2"
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {removeDashAndCapitalize(metadata.name)}
              </Text>
            )}

            {streetAddress && (
              <Text variant="body2" numberOfLines={1} adjustsFontSizeToFit>
                {streetAddress}
              </Text>
            )}
            <Text
              variant="subtitle3"
              color="secondaryText"
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {eccCompact ? ellipsizeAddress(eccCompact) : ''}
            </Text>
          </Box>
          <Box marginLeft="ms">
            {!!hasMobileRewards && (
              <Box
                flexDirection="row"
                justifyContent="space-between"
                alignItems="center"
                backgroundColor="mobileDarkBlue"
                borderRadius="xl"
                padding="xs"
                paddingRight="s"
                marginBottom="s"
              >
                <MobileSymbol color={colors.mobileBlue} />
                <Text variant="body2Medium" marginLeft="xs" color="mobileBlue">
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
                borderRadius="xl"
                padding="xs"
                paddingRight="s"
              >
                <IotSymbol color={colors.iotGreen} />
                <Text variant="body2Medium" marginLeft="xs" color="iotGreen">
                  {pendingIotRewardsString}
                </Text>
              </Box>
            )}
          </Box>
        </Box>
        {!recipientsAreDifferent ? (
          <>
            {(hasIotRecipient || hasMobileRecipient) && (
              <Box
                flex={1}
                paddingHorizontal="m"
                paddingBottom="ms"
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                gap={4}
              >
                <Box
                  flex={1}
                  flexDirection="row"
                  padding="s"
                  backgroundColor="black600"
                  borderRadius="m"
                  justifyContent="space-between"
                  position="relative"
                >
                  <Box
                    flexDirection="row"
                    alignItems="center"
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    gap={8}
                  >
                    {hasIotRecipient && <IotSymbol color={colors.flamenco} />}
                    {hasMobileRecipient && (
                      <MobileSymbol color={colors.flamenco} />
                    )}
                    <Text variant="body2" color="flamenco">
                      Destination
                    </Text>
                  </Box>
                  <Text variant="body1">
                    {ellipsizeAddress(
                      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-non-null-asserted-optional-chain
                      new PublicKey(iotRecipient?.destination!).toBase58(),
                    )}
                  </Text>
                </Box>
              </Box>
            )}
          </>
        ) : (
          <>
            {hasIotRecipient && (
              <Box
                flex={1}
                paddingHorizontal="m"
                paddingBottom="ms"
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                gap={4}
              >
                <Box
                  flex={1}
                  flexDirection="row"
                  padding="s"
                  backgroundColor="black600"
                  borderRadius="m"
                  justifyContent="space-between"
                  position="relative"
                >
                  <Box
                    flexDirection="row"
                    alignItems="center"
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    gap={8}
                  >
                    <IotSymbol color={colors.flamenco} />
                    <Text variant="body2" color="flamenco">
                      Destination
                    </Text>
                  </Box>
                  <Text variant="body1">
                    {ellipsizeAddress(
                      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-non-null-asserted-optional-chain
                      new PublicKey(iotRecipient?.destination!).toBase58(),
                    )}
                  </Text>
                </Box>
              </Box>
            )}
            {hasMobileRecipient && (
              <Box
                flex={1}
                paddingHorizontal="m"
                paddingBottom="ms"
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                gap={4}
              >
                <Box
                  flex={1}
                  flexDirection="row"
                  padding="s"
                  backgroundColor="black600"
                  borderRadius="m"
                  justifyContent="space-between"
                  position="relative"
                >
                  <Box
                    flexDirection="row"
                    alignItems="center"
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    gap={8}
                  >
                    <MobileSymbol color={colors.flamenco} />
                    <Text variant="body2" color="flamenco">
                      Destination
                    </Text>
                  </Box>
                  <Text variant="body1">
                    {ellipsizeAddress(
                      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-non-null-asserted-optional-chain
                      new PublicKey(mobileRecipient?.destination!).toBase58(),
                    )}
                  </Text>
                </Box>
              </Box>
            )}
          </>
        )}
      </TouchableOpacityBox>
    </ReAnimatedBox>
  )
}

export default HotspotListItem
