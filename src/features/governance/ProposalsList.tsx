import BlurActionSheet from '@components/BlurActionSheet'
import Box from '@components/Box'
import ListItem from '@components/ListItem'
import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { BoxProps } from '@shopify/restyle'
import { Theme } from '@theme/theme'
import React, { useCallback, useState } from 'react'
// import { useNavigation } from '@react-navigation/native'
import { useGovernance } from '@storage/GovernanceProvider'
import { ProposalCard, ProposalCardSkeleton } from './ProposalCard'
import {
  // GovernanceNavigationProp,
  ProposalFilter,
  ProposalV0,
} from './governanceTypes'

type IProposalsListProps = BoxProps<Theme>
export const ProposalsList = ({ ...boxProps }: IProposalsListProps) => {
  // const navigation = useNavigation<GovernanceNavigationProp>()
  const { proposals, loading } = useGovernance()
  const [filter, setFilter] = useState<ProposalFilter>('all')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const handleFilterPress = (f: ProposalFilter) => () => {
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
        {loading &&
          Array(3).map((_, idx) => (
            // eslint-disable-next-line react/no-array-index-key
            <ProposalCardSkeleton key={`prop-skeleton-${idx}`} />
          ))}
        {!loading &&
          proposals?.map((proposal, idx) => (
            <ProposalCard
              key={`${proposal.publicKey.toBase58()}`}
              filter={filter}
              proposal={proposal.info as ProposalV0}
              proposalKey={proposal.publicKey}
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
