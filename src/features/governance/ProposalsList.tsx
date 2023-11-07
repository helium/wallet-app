import BlurActionSheet from '@components/BlurActionSheet'
import Box from '@components/Box'
import ListItem from '@components/ListItem'
import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { BoxProps } from '@shopify/restyle'
import { PublicKey } from '@solana/web3.js'
import { Theme } from '@theme/theme'
import React, { useCallback, useState, useMemo } from 'react'
import { useNavigation } from '@react-navigation/native'
import { useGovNetwork } from '@hooks/useGovNetwork'
import { organizationKey, proposalKey } from '@helium/organization-sdk'
import { useOrganization } from '@helium/modular-governance-hooks'
import { ProposalCard } from './ProposalCard'
import { GovernanceNavigationProp, ProposalFilter } from './governanceTypes'

interface IProposalsListProps extends BoxProps<Theme> {
  mint: PublicKey
}

export const ProposalsList = ({ mint, ...boxProps }: IProposalsListProps) => {
  const navigation = useNavigation<GovernanceNavigationProp>()
  const [filter, setFilter] = useState<ProposalFilter>('all')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const { network } = useGovNetwork(mint)
  const [orgKey] = organizationKey(network)
  const { info: organization } = useOrganization(orgKey)
  const proposalKeys = useMemo(
    () =>
      Array(organization?.numProposals)
        .fill(0)
        .map((_, index) => proposalKey(orgKey, index)[0])
        .reverse(),
    [organization?.numProposals, orgKey],
  )

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
        {proposalKeys?.map((pKey, idx) => (
          <ProposalCard
            key={pKey.toBase58()}
            filter={filter}
            proposalKey={pKey}
            marginTop={idx > 0 ? 'm' : undefined}
            onPress={async (proposal) => {
              navigation.push('ProposalScreen', {
                proposal: proposal.toBase58(),
              })
            }}
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
