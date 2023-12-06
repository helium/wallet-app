import BlurActionSheet from '@components/BlurActionSheet'
import Box from '@components/Box'
import ListItem from '@components/ListItem'
import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { BoxProps } from '@shopify/restyle'
import { Theme } from '@theme/theme'
import React, { useCallback, useMemo, useState } from 'react'
import { useNavigation } from '@react-navigation/native'
import { useGovernance } from '@storage/GovernanceProvider'
import { useTranslation } from 'react-i18next'
import { organizationKey } from '@helium/organization-sdk'
import { useOrganizationProposals } from '@helium/modular-governance-hooks'
import CircleLoader from '@components/CircleLoader'
import { ProposalCard } from './ProposalCard'
import {
  GovernanceNavigationProp,
  ProposalFilter,
  ProposalV0,
} from './governanceTypes'

type IProposalsListProps = BoxProps<Theme>
export const ProposalsList = ({ ...boxProps }: IProposalsListProps) => {
  const { t } = useTranslation()
  const navigation = useNavigation<GovernanceNavigationProp>()
  const [filter, setFilter] = useState<ProposalFilter>('all')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const { network } = useGovernance()
  const organization = useMemo(() => organizationKey(network)[0], [network])
  const { loading, accounts: proposalsWithDups } =
    useOrganizationProposals(organization)

  const proposals = useMemo(() => {
    const seen = new Set()
    return proposalsWithDups?.filter((p) => {
      const has = seen.has(p.info?.name)
      seen.add(p.info?.name)

      return !has
    })
  }, [proposalsWithDups])

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
              {t('gov.proposals.filter', {
                filter: filter.charAt(0).toUpperCase() + filter.slice(1),
              })}
            </Text>
          </TouchableOpacityBox>
        </Box>
        {loading ? (
          <CircleLoader loaderSize={24} color="white" />
        ) : (
          proposals
            ?.filter((p) => Boolean(p.info))
            .map((proposal, idx) => (
              <ProposalCard
                key={proposal.publicKey.toBase58()}
                filter={filter}
                marginTop={idx > 0 ? 'm' : 'none'}
                proposal={proposal.info as ProposalV0}
                proposalKey={proposal.publicKey}
                onPress={async (m, p) =>
                  navigation.push('ProposalScreen', {
                    mint: m.toBase58(),
                    proposal: p.toBase58(),
                  })
                }
              />
            ))
        )}
      </Box>
      <BlurActionSheet
        title={t('gov.proposals.filterTitle')}
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
      >
        {filters()}
      </BlurActionSheet>
    </>
  )
}
