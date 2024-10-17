import Hex from '@assets/images/hex.svg'
import Box from '@components/Box'
import Text from '@components/Text'
import { useColors } from '@theme/themeHooks'
import React from 'react'

export const HotspotMapLegend = ({
  network,
}: {
  network: 'IOT' | 'MOBILE'
}) => {
  const colors = useColors()

  return (
    <Box
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      paddingTop="3"
      paddingBottom="4"
    >
      <Box
        flexDirection="row"
        flexWrap="wrap"
        paddingHorizontal="3"
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        gap={6}
      >
        <Box
          flexDirection="row"
          justifyContent="center"
          alignItems="center"
          paddingRight="3"
          paddingLeft="2"
          paddingVertical="1.5"
          borderRadius="full"
          backgroundColor="gray.700"
        >
          <Hex
            width={18}
            height={18}
            color={network === 'IOT' ? colors['green.500'] : colors['blue.500']}
          />
          <Text variant="textSmRegular" color="primaryText" marginLeft="xs">
            {network} Hotspot
          </Text>
        </Box>
        {network === 'MOBILE' && (
          <Box
            flexDirection="row"
            justifyContent="center"
            alignItems="center"
            paddingRight="3"
            paddingLeft="2"
            paddingVertical="1.5"
            borderRadius="full"
            backgroundColor="gray.700"
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            gap={6}
          >
            <Box
              flexDirection="row"
              justifyContent="center"
              alignItems="center"
            >
              <Hex
                width={18}
                height={18}
                color={colors['pink.500']}
                opacity={0.6}
              />
              <Text
                variant="textSmRegular"
                color="primaryText"
                marginLeft="1.5"
              >
                Low Boost
              </Text>
            </Box>
            <Box
              flexDirection="row"
              justifyContent="center"
              alignItems="center"
            >
              <Hex width={18} height={18} color={colors['pink.500']} />
              <Text
                variant="textSmRegular"
                color="primaryText"
                marginLeft="1.5"
              >
                High Boost
              </Text>
            </Box>
          </Box>
        )}
        <Box
          flexDirection="row"
          justifyContent="center"
          alignItems="center"
          paddingRight="3"
          paddingLeft="2"
          paddingVertical="1.5"
          borderRadius="full"
          backgroundColor="gray.700"
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          gap={8}
        >
          <Box flexDirection="row" justifyContent="center" alignItems="center">
            <Hex
              width={18}
              height={18}
              color={colors.solanaPurple}
              opacity={0.6}
            />
            <Text variant="textSmRegular" color="primaryText" marginLeft="xs">
              Weak Signal
            </Text>
          </Box>
          <Box flexDirection="row" justifyContent="center" alignItems="center">
            <Hex width={18} height={18} color={colors.solanaPurple} />
            <Text variant="textSmRegular" color="primaryText" marginLeft="xs">
              Strong Signal
            </Text>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
