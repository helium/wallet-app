import Box from '@components/Box'
import CircleLoader from '@components/CircleLoader'
import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { useKnownProxy } from '@helium/voter-stake-registry-hooks'
import { BoxProps } from '@shopify/restyle'
import { PublicKey } from '@solana/web3.js'
import { Color, Theme } from '@theme/theme'
import { useColors } from '@theme/themeHooks'
import { shortenAddress } from '@utils/formatting'
import React from 'react'
import { VoteChoiceWithMeta, VotingResultColors } from './governanceTypes'

export const VoteOption = ({
  option,
  didVote,
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
  didVote?: boolean
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
              !didVote ? 'transparent' : VotingResultColors[option.index]
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
        <Box
          flex={1}
          borderTopColor="primaryBackground"
          borderTopWidth={2}
          mt="ms"
          pt="s"
        >
          <Box
            flex={1}
            flexDirection="row"
            flexWrap="wrap"
            alignItems="center"
            {...{ gap: 4 }}
          >
            <Text variant="body2" color="secondaryText">
              Voted by -
            </Text>
            {voters.map((voter, idx) => (
              <>
                <Voter key={voter.toBase58()} voter={voter} />
                {idx !== voters.length - 1 && (
                  <Text variant="body2" color="secondaryText">
                    |
                  </Text>
                )}
              </>
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
    <Text variant="body2" color="red500">
      {knownProxy?.name || shortenAddress(voter.toBase58())}
    </Text>
  )
}
