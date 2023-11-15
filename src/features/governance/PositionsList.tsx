import Box from '@components/Box'
import Text from '@components/Text'
import { BoxProps } from '@shopify/restyle'
import { Theme } from '@theme/theme'
import LightningBolt from '@assets/images/transactions.svg'
import React from 'react'
import { PositionWithMeta } from '@helium/voter-stake-registry-hooks'
import { useColors } from '@theme/themeHooks'
import { PositionCard } from './PositionCard'

interface IPositionsListProps extends BoxProps<Theme> {
  positions?: PositionWithMeta[]
}

export const PositionsList = ({
  positions = [],
  ...boxProps
}: IPositionsListProps) => {
  const colors = useColors()

  return (
    <Box {...boxProps} flex={1}>
      <Box
        flexDirection="row"
        justifyContent="center"
        alignItems="center"
        paddingVertical="lm"
      >
        <Text variant="body3" color="secondaryText">
          Positions
        </Text>
      </Box>
      <Box
        flex={1}
        flexDirection="row"
        backgroundColor="secondaryBackground"
        alignItems="center"
        justifyContent="center"
        borderRadius="l"
        padding="ms"
        marginBottom="m"
        paddingLeft="none"
        {...boxProps}
      >
        <LightningBolt color={colors.blueBright500} height={36} width={36} />
        <Box flexShrink={1}>
          <Text variant="body2" color="secondaryText">
            Increase your voting power by locking tokens
          </Text>
        </Box>
      </Box>
      {positions?.map((p, idx) => (
        <PositionCard
          key={p.pubkey.toBase58()}
          position={p}
          marginTop={idx > 0 ? 'm' : undefined}
        />
      ))}
    </Box>
  )
}
