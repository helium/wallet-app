import Box from '@components/Box'
import ImageBox from '@components/ImageBox'
import Text from '@components/Text'
import { useHotspotAddress } from '@hooks/useHotspotAddress'
import React, { useMemo } from 'react'
import { ellipsizeAddress, formatLargeNumber } from '@utils/accountUtils'
import Hex from '@assets/images/hex.svg'
import { useColors } from '@theme/themeHooks'
import { HotspotWithPendingRewards } from '../../types/solana'

export const HotspotMapHotspotDetails = ({
  hotspot,
  network,
}: {
  hotspot: HotspotWithPendingRewards
  network: 'IOT' | 'MOBILE'
}) => {
  const colors = useColors()
  const streetAddress = useHotspotAddress(hotspot)
  const { metadata } = hotspot.content

  const eccCompact = useMemo(() => {
    if (!metadata || !metadata?.attributes?.length) {
      return undefined
    }

    return metadata.attributes.find(
      (attr: any) => attr?.trait_type === 'ecc_compact',
    )?.value
  }, [metadata])

  return (
    <Box padding="m">
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
        <Box flex={1} justifyContent="space-around">
          <Text
            variant="h3Bold"
            color="white"
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {hotspot.content.metadata.name}
          </Text>
          <Box flexDirection="row" gap={4}>
            {streetAddress && (
              <Box flex={1} gap={4} justifyContent="center">
                <Text numberOfLines={1} variant="body1">
                  {streetAddress}
                </Text>
              </Box>
            )}
            <Box justifyContent="center" alignItems="center">
              <Text variant="body1" color="secondaryText">
                •
              </Text>
            </Box>
            <Box flex={1} justifyContent="center" alignItems="flex-end">
              <Text variant="body1" numberOfLines={1}>
                {eccCompact}
              </Text>
            </Box>
          </Box>
        </Box>
      </Box>
      <Box flexDirection="row" marginTop="m">
        <Box flex={1} flexDirection="row" justifyContent="space-between">
          <Box>
            <Text variant="body2">Transmit Scale</Text>
            <Box flexDirection="row" alignItems="center">
              <Hex
                width={16}
                height={16}
                color={
                  network === 'IOT' ? colors.orange500 : colors.jazzberryJam
                }
              />
              <Text marginLeft="s" variant="body2">
                0.19
              </Text>
            </Box>
          </Box>
          <Box>
            <Text variant="body2">Maker</Text>
            <Text variant="body2">PantherX</Text>
          </Box>
          <Box>
            <Text variant="body2">Gain</Text>
            <Text variant="body2">4 dBi</Text>
          </Box>
          <Box>
            <Text variant="body2">Elevatio</Text>
            <Text variant="body2">30m</Text>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
