import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import BN from 'bn.js'
import React from 'react'
import Box from '@components/Box'
import CircleLoader from '@components/CircleLoader'
import { useColors } from '@theme/themeHooks'
import { Color, Theme } from '@theme/theme'
import { BoxProps } from '@shopify/restyle'
import { VoteChoiceWithMeta, VotingResultColors } from './governanceTypes'
import { PublicKey } from '@solana/web3.js'
import { useKnownProxy } from '@helium/voter-stake-registry-hooks'
import { shortenAddress } from '@utils/formatting'
import { Pill } from '@components/Pill'

export const VoteOption = ({
  option,
  myWeight,
  canVote,
  canRelinquishVote,
  voting,
  onVote,
  onRelinquishVote,
  voters,
  ...boxProps
}: {
  voters?: PublicKey[]
  option: VoteChoiceWithMeta
  myWeight?: BN
  canVote: boolean
  canRelinquishVote: boolean
  voting: boolean
  onVote?: () => Promise<void>
  onRelinquishVote?: () => Promise<void>
} & BoxProps<Theme>) => {
  const colors = useColors()

  return (
    <TouchableOpacityBox
      flexGrow={1}
      flexDirection="column"
      padding="ms"
      borderRadius="m"
      backgroundColor="surfaceSecondary"
      {...boxProps}
      onPress={
        // eslint-disable-next-line no-nested-ternary
        canVote ? onVote : canRelinquishVote ? onRelinquishVote : undefined
      }
    >
      <Box flexDirection="row">
        {!voting ? (
          <Box
            width={20}
            height={20}
            borderRadius="round"
            marginRight="ms"
            borderWidth={2}
            borderColor={VotingResultColors[option.index]}
            backgroundColor={
              !myWeight ? 'transparent' : VotingResultColors[option.index]
            }
          />
        ) : (
          <Box marginRight="ms">
            <CircleLoader
              color={colors[VotingResultColors[option.index]] as Color}
              loaderSize={20}
            />
          </Box>
        )}

        <Text variant="body2" color="secondaryText">
          {option.name}
        </Text>
      </Box>

      {voters && voters.length > 0 && (
        <Box flexDirection="row" alignItems="center">
          <Text variant="body2" color="secondaryText">
            Voted by
          </Text>
          <Box flexDirection="row" flexWrap="wrap">
            {voters.map((voter) => (
              <Voter key={voter.toBase58()} voter={voter} />
            ))}
          </Box>
        </Box>
      )}
    </TouchableOpacityBox>
  )
}

export const Voter = ({ voter }: { voter: PublicKey }) => {
  const { knownProxy } = useKnownProxy(voter)
  return (
    <Box ml="xs">
      <Pill
        color="red"
        text={knownProxy?.name || shortenAddress(voter.toBase58())}
      />
    </Box>
  )
}
