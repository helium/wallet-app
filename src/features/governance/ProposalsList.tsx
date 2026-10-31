import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet'
import { useOrganizationProposals } from '@helium/modular-governance-hooks'
import { useNavigation } from '@react-navigation/native'
import { useAccountStorage } from '@storage/AccountStorageProvider'
import { useGovernance } from '@storage/GovernanceProvider'
import { getDerivedProposalState } from '@utils/governanceUtils'
import { PressableScale } from '@ui/PressableScale'
import { Sheet } from '@ui/Sheet'
import { Spinner } from '@ui/Spinner'
import { Text } from '@ui/Text'
import { twMerge } from '@ui/twMerge'
import { CircleCheck } from 'lucide-react-native'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { withUniwind } from 'uniwind'
import { ProposalCard } from './ProposalCard'
import {
  GovernanceNavigationProp,
  ProposalFilter,
  ProposalV0,
} from './governanceTypes'

const SafeArea = withUniwind(SafeAreaView)
const SelectedIcon = withUniwind(CircleCheck)

const FILTERS: ProposalFilter[] = [
  'all',
  'active',
  'unseen',
  'passed',
  'failed',
  'cancelled',
]

export const ProposalsList = ({ className }: { className?: string }) => {
  const { t } = useTranslation()
  const { upsertAccount, currentAccount } = useAccountStorage()
  const navigation = useNavigation<GovernanceNavigationProp>()
  const { loading, mint, organization } = useGovernance()
  const { loading: loadingProposals, accounts: proposalsWithDups } =
    useOrganizationProposals(organization)
  const [filter, setFilter] = useState<ProposalFilter>('all')
  const filtersRef = useRef<BottomSheetModal>(null)

  const isLoading = useMemo(
    () => !currentAccount || loading || loadingProposals || !proposalsWithDups,
    [currentAccount, loading, loadingProposals, proposalsWithDups],
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
  useEffect(() => {
    const run = async () => {
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
    }
    run().catch((e) => console.error(e))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proposalsWithDups])

  const handleFilterPress = (f: ProposalFilter) => () => {
    setFilter(f)
    filtersRef.current?.dismiss()
  }

  return (
    <>
      <View className={twMerge('flex-1', className)}>
        <View className="flex-row justify-center">
          <PressableScale
            feedback="opacity"
            className="flex-row justify-center px-12 py-3"
            onPress={() => filtersRef.current?.present()}
          >
            <Text size="sm" className="text-muted-foreground">
              {t('gov.proposals.filter', {
                filter: filter.charAt(0).toUpperCase() + filter.slice(1),
              })}
            </Text>
          </PressableScale>
        </View>
        {isLoading ? (
          <Spinner />
        ) : (
          proposals
            ?.filter((p) => Boolean(p.info))
            .map((proposal, idx) => (
              <ProposalCard
                key={proposal.publicKey.toBase58()}
                filter={filter}
                className={idx > 0 ? 'mt-4' : undefined}
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
      </View>
      <Sheet ref={filtersRef} enablePanDownToClose>
        <BottomSheetView>
          <SafeArea edges={['bottom']} className="pb-4">
            <Text size="xl" className="px-6 pb-2 tracking-tight">
              {t('gov.proposals.filterTitle')}
            </Text>
            {FILTERS.map((f) => (
              <PressableScale
                key={f}
                accessibilityState={{ selected: filter === f }}
                feedback="opacity"
                className="flex-row items-center justify-between px-6 py-4"
                onPress={handleFilterPress(f)}
              >
                <Text size="base" className="font-medium">
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </Text>
                {filter === f ? (
                  <SelectedIcon size={20} colorClassName="accent-primary" />
                ) : null}
              </PressableScale>
            ))}
          </SafeArea>
        </BottomSheetView>
      </Sheet>
    </>
  )
}
