import Box from '@components/Box'
import Text from '@components/Text'
import { BoxProps } from '@shopify/restyle'
import { Theme } from '@theme/theme'
import React, { useState } from 'react'
import { ScrollView } from 'react-native'
import { ProposalCard } from './ProposalCard'

interface IProposalsListProps extends BoxProps<Theme> {
  proposals?: string[]
}

type Filter = 'all' | 'active' | 'passed' | 'failed'
export const ProposalsList = ({
  proposals,
  ...boxProps
}: IProposalsListProps) => {
  const [filter] = useState<Filter>('all')

  return (
    <Box {...boxProps} flex={1}>
      <Box flexDirection="row" justifyContent="center" padding="m">
        <Text variant="body3" color="secondaryText">
          {`Proposals: ${filter.charAt(0).toUpperCase() + filter.slice(1)}`}
        </Text>
      </Box>
      <ScrollView>
        {proposals?.map((p, idx) => (
          <ProposalCard
            // eslint-disable-next-line react/no-array-index-key
            key={`proposal-${idx}`}
            proposal={p}
            marginTop={idx > 0 ? 'm' : undefined}
          />
        ))}
      </ScrollView>
    </Box>
  )
}
