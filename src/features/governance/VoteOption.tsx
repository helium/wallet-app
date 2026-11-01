import { useKnownProxy } from '@helium/voter-stake-registry-hooks'
import { PublicKey } from '@solana/web3.js'
import { PressableScale } from '@ui/PressableScale'
import { Spinner } from '@ui/Spinner'
import { Text } from '@ui/Text'
import { twMerge } from '@ui/twMerge'
import { shortenAddress } from '@utils/formatting'
import React, { useRef } from 'react'
import { View } from 'react-native'
import { VoteChoiceWithMeta, VotingResultColors } from './governanceTypes'

// Each choice keeps its fixed data colour, so it is a JS value, not a token.
export const votingResultColor = (index: number) => VotingResultColors[index]

export const VoteOption = ({
  option,
  didVote,
  canVote,
  canRelinquishVote,
  voting,
  onVote,
  onRelinquishVote,
  voters,
  className,
}: {
  voters?: PublicKey[]
  option: VoteChoiceWithMeta
  didVote?: boolean
  canVote: boolean
  canRelinquishVote: boolean
  voting: boolean
  onVote?: () => Promise<void>
  onRelinquishVote?: () => Promise<void>
  className?: string
}) => {
  const color = votingResultColor(option.index)
  const fill = didVote ? color : 'transparent'
  const handleVote = canVote
    ? onVote
    : canRelinquishVote
      ? onRelinquishVote
      : undefined
  // `voting` renders a tick late, so a ref holds the option until its call settles
  const sending = useRef(false)
  const send =
    handleVote &&
    (() => {
      if (sending.current) return
      sending.current = true
      void handleVote()
        .catch(console.error)
        .finally(() => {
          sending.current = false
        })
    })

  return (
    <PressableScale
      feedback="opacity"
      className={twMerge(
        'grow flex-col rounded-md bg-secondary p-3',
        className,
      )}
      onPress={send}
    >
      <View className="flex-row">
        {!voting ? (
          <View
            className="mr-3 size-5 rounded-full border-2"
            style={{
              borderColor: color,
              backgroundColor: fill,
            }}
          />
        ) : (
          <View className="mr-3">
            <Spinner color={color} />
          </View>
        )}

        <Text className="text-muted-foreground">{option.name}</Text>
      </View>

      {voters && voters.length > 0 && (
        <View className="mt-3 flex-1 border-t-2 border-background pt-2">
          <View className="flex-1 flex-row flex-wrap items-center gap-1">
            <Text className="text-muted-foreground">Voted by -</Text>
            {voters.map((voter, idx) => (
              <React.Fragment key={voter.toBase58()}>
                <Voter voter={voter} />
                {idx !== voters.length - 1 && (
                  <Text className="text-muted-foreground">|</Text>
                )}
              </React.Fragment>
            ))}
          </View>
        </View>
      )}
    </PressableScale>
  )
}

export const Voter = ({ voter }: { voter: PublicKey }) => {
  const { knownProxy } = useKnownProxy(voter)
  return (
    <Text className="text-destructive">
      {knownProxy?.name || shortenAddress(voter.toBase58())}
    </Text>
  )
}
