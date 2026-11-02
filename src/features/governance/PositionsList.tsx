import { CardSkeleton } from '@ui/CardSkeleton'
import { useMint, useSolanaUnixNow } from '@helium/helium-react-hooks'
import {
  PositionWithMeta,
  useSubDaos,
} from '@helium/voter-stake-registry-hooks'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import { PublicKey } from '@solana/web3.js'
import { useGovernance } from '@storage/GovernanceProvider'
import { useQuery } from '@tanstack/react-query'
import { Text } from '@ui/Text'
import { twMerge } from '@ui/twMerge'
import { times, uniq } from 'lodash'
import { Zap } from 'lucide-react-native'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { RefreshControl, SectionList, View } from 'react-native'
import { useCSSVariable, withUniwind } from 'uniwind'
import { PositionCard } from './PositionCard'
import { usePositionActions } from './usePositionActions'

const ZapIcon = withUniwind(Zap)

interface IPositionsListProps {
  header?: React.ReactElement
  className?: string
}

export const PositionsList = ({ header, className }: IPositionsListProps) => {
  const {
    loading: loadingGov,
    positions,
    refetch,
    mint,
    voteService,
  } = useGovernance()
  const { loading: loadingSubDaos, result: subDaos } = useSubDaos()
  // One fetch for all rows: each row used to fetch these itself
  const unixNow = useSolanaUnixNow(60 * 5 * 1000) || 0
  const { info: mintAcc } = useMint(mint)
  const { loading: loadingMetadata, symbol, json } = useMetaplexMetadata(mint)
  const proxyVoters = uniq(
    (positions || [])
      .filter((p) => p.proxy && !p.proxy.nextVoter.equals(PublicKey.default))
      .map((p) => p.proxy!.nextVoter.toBase58()),
  )
  // The first proxy that matches each voter, as useKnownProxy finds it
  const { data: knownProxyNames } = useQuery({
    queryKey: ['knownProxyNames', voteService?.config, proxyVoters],
    enabled: !!voteService && proxyVoters.length > 0,
    queryFn: async () => {
      const found = await Promise.all(
        proxyVoters.map((voter) =>
          voteService!.getProxies({ page: 1, limit: 1, query: voter }),
        ),
      )
      return Object.fromEntries(
        proxyVoters.map((voter, i) => [voter, found[i][0]?.name]),
      ) as Record<string, string | undefined>
    },
  })
  const { openActions, statusOf, sheets } = usePositionActions({
    subDaos,
    unixNow,
    mintAcc,
    symbol,
  })
  const foreground = useCSSVariable('--color-foreground')
  const { t } = useTranslation()

  const loading = !subDaos || loadingSubDaos || loadingGov

  const sortedPositions = loading
    ? []
    : positions?.sort((a, b) => {
        if (a.hasGenesisMultiplier || b.hasGenesisMultiplier) {
          if (b.hasGenesisMultiplier) {
            return a.amountDepositedNative.gt(b.amountDepositedNative) ? -1 : 1
          }
          return 0
        }

        if (a.isDelegated || b.isDelegated) {
          if (a.isDelegated && !b.isDelegated) return -1
          if (b.isDelegated && !a.isDelegated) return 1

          return a.amountDepositedNative.gt(b.amountDepositedNative) ? -1 : 1
        }

        return a.amountDepositedNative.gt(b.amountDepositedNative) ? -1 : 1
      })

  const proxiedPositions = sortedPositions?.filter((p) => p.isProxiedToMe)
  const unProxiedPositions = sortedPositions?.filter((p) => !p.isProxiedToMe)

  const renderItem = ({
    item: p,
    index: idx,
  }: {
    item: PositionWithMeta
    index: number
  }) => {
    if (!p.votingMint) {
      return null
    }
    const { loadingText, transactionError } = statusOf(p)
    return (
      <PositionCard
        key={`${p.pubkey.toBase58()}-${p.amountDepositedNative.toString()}-${idx}`}
        position={p}
        className={idx > 0 ? 'mt-4' : undefined}
        subDaos={subDaos}
        onPress={() => openActions(p)}
        unixNow={unixNow}
        decimals={mintAcc?.decimals}
        symbol={symbol}
        image={json?.image}
        loadingMetadata={loadingMetadata}
        knownProxyName={
          p.proxy ? knownProxyNames?.[p.proxy.nextVoter.toBase58()] : undefined
        }
        loadingText={loadingText}
        transactionError={transactionError}
      />
    )
  }

  const keyExtractor = (item: PositionWithMeta) => item.pubkey.toBase58()

  const renderEmptyComponent = () => {
    if (!positions) return null

    if (loading) {
      return (
        <View className="flex-1">
          {times(5).map((i) => (
            <CardSkeleton height={POSITION_HEIGHT} key={i} />
          ))}
        </View>
      )
    }

    return (
      <View
        style={{ height: POSITION_HEIGHT }}
        className="mb-4 w-full items-center justify-center rounded-[12px] bg-secondary"
      >
        <Text size="base">{t('gov.positions.noneFound')}</Text>
      </View>
    )
  }

  const SectionData = [
    { title: 'My Positions', data: unProxiedPositions || [], icon: null },
    { title: 'Proxied To Me', data: proxiedPositions || [], icon: null },
  ]

  const renderSectionHeader = ({
    section: { title, icon },
  }: {
    section: { title: string; icon: React.ReactNode }
  }) => (
    <View className="flex-row items-center justify-center bg-background px-6 py-4">
      {icon !== undefined && icon}
      <Text size="xs" className="text-center text-muted-foreground">
        {title}
      </Text>
    </View>
  )

  return (
    <>
      <SectionList
        contentInsetAdjustmentBehavior="automatic"
        renderSectionHeader={renderSectionHeader}
        ListHeaderComponent={
          <>
            {header}
            <View className="flex-row items-center justify-center py-5">
              <Text size="xs" className="text-muted-foreground">
                Positions
              </Text>
            </View>
            <View
              className={twMerge(
                'mb-4 flex-1 flex-row items-center justify-center gap-3 rounded-[12px] bg-secondary p-3',
                className,
              )}
            >
              <ZapIcon size={24} colorClassName="accent-blue-dark-500" />
              <View className="shrink">
                <Text className="text-muted-foreground">
                  Increase your voting power by locking tokens
                </Text>
              </View>
            </View>
          </>
        }
        keyExtractor={keyExtractor}
        sections={loading ? [] : SectionData}
        renderItem={renderItem}
        ListEmptyComponent={renderEmptyComponent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refetch}
            title=""
            tintColor={typeof foreground === 'string' ? foreground : undefined}
          />
        }
      />
      {sheets}
    </>
  )
}

const POSITION_HEIGHT = 120
