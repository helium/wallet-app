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
      paddingTop="ms"
      paddingBottom="m"
    >
      <Box
        flexDirection="row"
        flexWrap="wrap"
        paddingHorizontal="ms"
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        gap={6}
      >
        <Box
          flexDirection="row"
          justifyContent="center"
          alignItems="center"
          paddingRight="ms"
          paddingLeft="s"
          paddingVertical="sx"
          borderRadius="round"
          backgroundColor="darkGrey"
        >
          <Hex
            width={18}
            height={18}
            color={network === 'IOT' ? colors.green500 : colors.blue500}
          />
          <Text variant="body2" color="primaryText" marginLeft="xs">
            {network} Hotspot
          </Text>
        </Box>
        {network === 'MOBILE' && (
          <Box
            flexDirection="row"
            justifyContent="center"
            alignItems="center"
            paddingRight="ms"
            paddingLeft="s"
            paddingVertical="sx"
            borderRadius="round"
            backgroundColor="darkGrey"
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
                color={colors.jazzberryJam}
                opacity={0.6}
              />
              <Text variant="body2" color="primaryText" marginLeft="sx">
                Low Boost
              </Text>
            </Box>
            <Box
              flexDirection="row"
              justifyContent="center"
              alignItems="center"
            >
              <Hex width={18} height={18} color={colors.jazzberryJam} />
              <Text variant="body2" color="primaryText" marginLeft="sx">
                High Boost
              </Text>
            </Box>
          </Box>
        )}
        <Box
          flexDirection="row"
          justifyContent="center"
          alignItems="center"
          paddingRight="ms"
          paddingLeft="s"
          paddingVertical="sx"
          borderRadius="round"
          backgroundColor="darkGrey"
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
            <Text variant="body2" color="primaryText" marginLeft="xs">
              Weak Signal
            </Text>
          </Box>
          <Box flexDirection="row" justifyContent="center" alignItems="center">
            <Hex width={18} height={18} color={colors.solanaPurple} />
            <Text variant="body2" color="primaryText" marginLeft="xs">
              Strong Signal
            </Text>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
