import BlurActionSheet from '@components/BlurActionSheet'
import Box from '@components/Box'
import ListItem from '@components/ListItem'
import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { BoxProps } from '@shopify/restyle'
import { Theme } from '@theme/theme'
import React, { useCallback, useState } from 'react'
import { useNavigation } from '@react-navigation/native'
import { useGovernance } from '@storage/GovernanceProvider'
import { ProposalCard, ProposalCardSkeleton } from './ProposalCard'
import {
  GovernanceNavigationProp,
  ProposalFilter,
  ProposalV0,
} from './governanceTypes'

type IProposalsListProps = BoxProps<Theme>
export const ProposalsList = ({ ...boxProps }: IProposalsListProps) => {
  const navigation = useNavigation<GovernanceNavigationProp>()
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
        <ListItem
          key="cancelled"
          title="Cancelled"
          onPress={handleFilterPress('cancelled')}
          selected={filter === 'cancelled'}
          hasPressedState={false}
        />
      </>
    ),
    [filter],
  )

  return (
    <>
      <Box {...boxProps} flex={1}>
        <Box flexDirection="row" justifyContent="center">
          <TouchableOpacityBox
            paddingVertical="lm"
            onPress={() => setFiltersOpen(true)}
          >
            <Text variant="body3" color="secondaryText">
              {`Proposals: ${filter.charAt(0).toUpperCase() + filter.slice(1)}`}
            </Text>
          </TouchableOpacityBox>
        </Box>
        {loading && <ProposalCardSkeleton backgroundColor="transparent" />}
        <Box gap="m">
          {!loading &&
            proposals
              ?.filter((p) => Boolean(p.info))
              .map((proposal) => (
                <ProposalCard
                  key={proposal.publicKey.toBase58()}
                  filter={filter}
                  proposal={proposal.info as ProposalV0}
                  proposalKey={proposal.publicKey}
                  onPress={async (p) =>
                    navigation.push('ProposalScreen', {
                      proposal: p.toBase58(),
                    })
                  }
                />
              ))}
        </Box>
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
