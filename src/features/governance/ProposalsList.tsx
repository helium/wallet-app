import BlurActionSheet from '@components/BlurActionSheet'
import Box from '@components/Box'
import ListItem from '@components/ListItem'
import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { BoxProps } from '@shopify/restyle'
import { PublicKey } from '@solana/web3.js'
import { Theme } from '@theme/theme'
import React, { useCallback, useState } from 'react'
import { ProposalCard } from './ProposalCard'

interface IProposalsListProps extends BoxProps<Theme> {
  proposals?: PublicKey[]
}

type Filter = 'all' | 'active' | 'passed' | 'failed'
export const ProposalsList = ({
  proposals,
  ...boxProps
}: IProposalsListProps) => {
  const [filter, setFilter] = useState<Filter>('all')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const handleFilterPress = (f: Filter) => () => {
    setFilter(f)
    setFiltersOpen(false)
  }

  const filters = useCallback(
    () => (
      <>
        <ListItem
          key="all"
          title="All"
          onPress={handleFilterPress('all')}
          selected={filter === 'all'}
          hasPressedState={false}
        />
        <ListItem
          key="active"
          title="Active"
          onPress={handleFilterPress('active')}
          selected={filter === 'active'}
          hasPressedState={false}
        />
        <ListItem
          key="passed"
          title="Passed"
          onPress={handleFilterPress('passed')}
          selected={filter === 'passed'}
          hasPressedState={false}
        />
        <ListItem
          key="failed"
          title="Failed"
          onPress={handleFilterPress('failed')}
          selected={filter === 'failed'}
          hasPressedState={false}
        />
      </>
    ),
    [filter],
  )

  return (
    <>
      <Box {...boxProps} flex={1}>
        <TouchableOpacityBox
          flexDirection="row"
          justifyContent="center"
          paddingVertical="l"
          onPress={() => setFiltersOpen(true)}
        >
          <Text variant="body3" color="secondaryText">
            {`Proposals: ${filter.charAt(0).toUpperCase() + filter.slice(1)}`}
          </Text>
        </TouchableOpacityBox>
        {proposals?.map((p, idx) => (
          <ProposalCard
            // eslint-disable-next-line react/no-array-index-key
            key={`proposal-${idx}`}
            proposal={p}
            marginTop={idx > 0 ? 'm' : undefined}
          />
        ))}
      </Box>
      <BlurActionSheet
        title="Filter Proposals"
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
      >
        {filters()}
      </BlurActionSheet>
    </>
  )
}
