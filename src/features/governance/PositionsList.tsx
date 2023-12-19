import Box from '@components/Box'
import Text from '@components/Text'
import { BoxProps } from '@shopify/restyle'
import { Theme } from '@theme/theme'
import LightningBolt from '@assets/images/transactions.svg'
import React, { useMemo } from 'react'
import {
  PositionWithMeta,
  useSubDaos,
} from '@helium/voter-stake-registry-hooks'
import { useColors } from '@theme/themeHooks'
import CircleLoader from '@components/CircleLoader'
import { PositionCard } from './PositionCard'

interface IPositionsListProps extends BoxProps<Theme> {
  positions?: PositionWithMeta[]
}

export const PositionsList = ({
  positions = [],
  ...boxProps
}: IPositionsListProps) => {
  const { loading: loadingSubDaos, result: subDaos } = useSubDaos()
  const colors = useColors()

  const loading = useMemo(
    () => !subDaos || loadingSubDaos,
    [subDaos, loadingSubDaos],
  )

  const sortedPositions = useMemo(
    () =>
      loading
        ? []
        : positions?.sort((a, b) => {
            if (a.hasGenesisMultiplier || b.hasGenesisMultiplier) {
              if (b.hasGenesisMultiplier) {
                return a.amountDepositedNative.gt(b.amountDepositedNative)
                  ? 0
                  : -1
              }
              return -1
            }

            if (a.isDelegated || b.isDelegated) {
              if (a.isDelegated && !b.isDelegated) return -1
              if (b.isDelegated && !a.isDelegated) return 0
              return 0
            }

            return a.amountDepositedNative.gt(b.amountDepositedNative) ? -1 : 0
          }),
    [positions, loading],
  )

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
      <Box>
        {loading ? (
          <CircleLoader loaderSize={24} color="white" />
        ) : (
          sortedPositions?.map((p, idx) => (
            <PositionCard
              key={`${p.pubkey.toBase58()}${p.amountDepositedNative.toString()}${p.delegatedSubDao?.toBase58()}}`}
              position={p}
              marginTop={idx > 0 ? 'm' : 'none'}
              subDaos={subDaos}
            />
          ))
        )}
      </Box>
    </Box>
  )
}
