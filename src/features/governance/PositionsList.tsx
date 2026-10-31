import { CardSkeleton } from '@components/CardSkeleton'
import {
  PositionWithMeta,
  useSubDaos,
} from '@helium/voter-stake-registry-hooks'
import { useGovernance } from '@storage/GovernanceProvider'
import { Text } from '@ui/Text'
import { twMerge } from '@ui/twMerge'
import { times } from 'lodash'
import { Zap } from 'lucide-react-native'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { RefreshControl, SectionList, View } from 'react-native'
import { useCSSVariable, withUniwind } from 'uniwind'
import { PositionCard } from './PositionCard'

const ZapIcon = withUniwind(Zap)

interface IPositionsListProps {
  header?: React.ReactElement
  className?: string
}

export const PositionsList = ({ header, className }: IPositionsListProps) => {
  const { loading: loadingGov, positions, refetch } = useGovernance()
  const { loading: loadingSubDaos, result: subDaos } = useSubDaos()
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
    return (
      <PositionCard
        key={`${p.pubkey.toBase58()}-${p.amountDepositedNative.toString()}-${idx}`}
        position={p}
        className={idx > 0 ? 'mt-4' : undefined}
        subDaos={subDaos}
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
  )
}

const POSITION_HEIGHT = 120
