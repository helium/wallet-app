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
import { useAsync } from 'react-async-hook'
import { useAccountStorage } from '@storage/AccountStorageProvider'
import { getDerivedProposalState } from '@utils/governanceUtils'
import { ProposalCard } from './ProposalCard'
import {
  GovernanceNavigationProp,
  ProposalFilter,
  ProposalV0,
} from './governanceTypes'

type IProposalsListProps = BoxProps<Theme>
export const ProposalsList = ({ ...boxProps }: IProposalsListProps) => {
  const { t } = useTranslation()
  const { upsertAccount, currentAccount } = useAccountStorage()
  const navigation = useNavigation<GovernanceNavigationProp>()
  const [filter, setFilter] = useState<ProposalFilter>('all')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const { mint, network } = useGovernance()
  const organization = useMemo(() => organizationKey(network)[0], [network])
  const { loading, accounts: proposalsWithDups } =
    useOrganizationProposals(organization)

  const isLoading = useMemo(
    () => !currentAccount || loading || !proposalsWithDups,
    [currentAccount, loading, proposalsWithDups],
  )

  const proposals = useMemo(() => {
    const seen = new Set()
    return proposalsWithDups
      ?.filter((p) => {
        const has = seen.has(p.info?.name)
        seen.add(p.info?.name)

        return !has
      })
      .filter((proposal) => {
        if (filter === 'all') return true
        if (
          filter === 'unseen' &&
          currentAccount?.proposalIdsSeenByMint &&
          !currentAccount?.proposalIdsSeenByMint[mint.toBase58()]?.includes(
            proposal.publicKey.toBase58(),
          )
        ) {
          return true
        }
        return getDerivedProposalState(proposal.info as ProposalV0) === filter
      })
  }, [mint, filter, currentAccount, proposalsWithDups])

  // If we have no record of proposals seen by mint, set it to all proposals
  // In order to prevent spamming the Ui with false positives of past proposals
  // being unseen, new proposals should act properly
  useAsync(async () => {
    if (currentAccount && proposalsWithDups) {
      const shouldUpdateIds =
        currentAccount.proposalIdsSeenByMint === undefined ||
        currentAccount.proposalIdsSeenByMint[mint.toBase58()] === undefined

      const shouldUpdateCount =
        currentAccount.proposalCountByMint === undefined ||
        currentAccount.proposalCountByMint[mint.toBase58()] === undefined ||
        currentAccount.proposalCountByMint[mint.toBase58()] !==
          proposalsWithDups.length

      if (shouldUpdateIds || shouldUpdateCount) {
        await upsertAccount({
          ...currentAccount,
          ...(shouldUpdateCount && {
            proposalCountByMint: {
              ...currentAccount?.proposalCountByMint,
              [mint.toBase58()]: proposalsWithDups.length,
            },
          }),
          ...(shouldUpdateIds && {
            proposalIdsSeenByMint: {
              ...currentAccount?.proposalIdsSeenByMint,
              [mint.toBase58()]: [
                ...proposalsWithDups.reduce((acc, p) => {
                  acc.add(p.publicKey.toBase58())
                  return acc
                }, new Set<string>()),
              ],
            },
          }),
        })
      }
    }
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
          key="unseen"
          title="Unseen"
          onPress={handleFilterPress('unseen')}
          selected={filter === 'unseen'}
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
            paddingHorizontal="xxl"
            flexDirection="row"
            justifyContent="center"
            onPress={() => setFiltersOpen(true)}
          >
            <Text variant="body3" color="secondaryText">
              {t('gov.proposals.filter', {
                filter: filter.charAt(0).toUpperCase() + filter.slice(1),
              })}
            </Text>
          </TouchableOpacityBox>
        </Box>
        {isLoading ? (
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
