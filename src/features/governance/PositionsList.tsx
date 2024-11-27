import LightningBolt from '@assets/svgs/transactions.svg'
import Box from '@components/Box'
import { CardSkeleton } from '@components/CardSkeleton'
import Text from '@components/Text'
import {
  PositionWithMeta,
  useSubDaos,
} from '@helium/voter-stake-registry-hooks'
import { BoxProps } from '@shopify/restyle'
import { useGovernance } from '@config/storage/GovernanceProvider'
import { Theme } from '@config/theme/theme'
import { useColors } from '@config/theme/themeHooks'
import { times } from 'lodash'
import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { RefreshControl, SectionList } from 'react-native'
import ScrollBox from '@components/ScrollBox'
import { PositionCard } from './PositionCard'

interface IPositionsListProps extends BoxProps<Theme> {
  header?: React.ReactElement
}

export const PositionsList = ({ header, ...boxProps }: IPositionsListProps) => {
  const { loading: loadingGov, positions, refetch } = useGovernance()
  const { loading: loadingSubDaos, result: subDaos } = useSubDaos()
  const colors = useColors()
  const { t } = useTranslation()

  const loading = useMemo(
    () => !subDaos || loadingSubDaos || loadingGov,
    [subDaos, loadingSubDaos, loadingGov],
  )

  const sortedPositions = useMemo(
    () =>
      loading
        ? []
        : positions?.sort((a, b) => {
            if (a.hasGenesisMultiplier || b.hasGenesisMultiplier) {
              if (b.hasGenesisMultiplier) {
                return a.amountDepositedNative.gt(b.amountDepositedNative)
                  ? -1
                  : 1
              }
              return 0
            }

            if (a.isDelegated || b.isDelegated) {
              if (a.isDelegated && !b.isDelegated) return -1
              if (b.isDelegated && !a.isDelegated) return 1

              return a.amountDepositedNative.gt(b.amountDepositedNative)
                ? -1
                : 1
            }

            return a.amountDepositedNative.gt(b.amountDepositedNative) ? -1 : 1
          }),
    [positions, loading],
  )

  const proxiedPositions = useMemo(
    () => sortedPositions?.filter((p) => p.isProxiedToMe),
    [sortedPositions],
  )
  const unProxiedPositions = useMemo(
    () => sortedPositions?.filter((p) => !p.isProxiedToMe),
    [sortedPositions],
  )
  const renderItem = useCallback(
    ({ item: p, index: idx }) => {
      return (
        <PositionCard
          // eslint-disable-next-line react/no-array-index-key
          key={`${p.pubkey.toBase58()}-${p.amountDepositedNative.toString()}-${idx}`}
          position={p}
          marginTop={idx > 0 ? '4' : 'none'}
          subDaos={subDaos}
        />
      )
    },
    [subDaos],
  )

  const keyExtractor = useCallback(
    (item: PositionWithMeta) => item.pubkey.toBase58(),
    [],
  )

  const renderEmptyComponent = useCallback(() => {
    if (!positions) return null

    if (loading) {
      return (
        <Box flex={1} flexDirection="column">
          {times(5).map((i) => (
            <CardSkeleton height={POSITION_HEIGHT} key={i} />
          ))}
        </Box>
      )
    }

    return (
      <Box
        backgroundColor="bg.tertiary"
        borderRadius="2xl"
        height={POSITION_HEIGHT}
        width="100%"
        justifyContent="center"
        alignItems="center"
        mb="4"
      >
        <Text variant="textMdRegular" color="primaryText">
          {t('gov.positions.noneFound')}
        </Text>
      </Box>
    )
  }, [loading, positions, t])

  const SectionData = useMemo(() => {
    return [
      { title: 'My Positions', data: unProxiedPositions || [], icon: null },
      { title: 'Proxied To Me', data: proxiedPositions || [], icon: null },
    ]
  }, [proxiedPositions, unProxiedPositions])

  const renderSectionHeader = useCallback(
    ({ section: { title, icon } }) => (
      <Box
        flexDirection="row"
        alignItems="center"
        paddingTop="4"
        paddingBottom="4"
        paddingHorizontal="6"
        backgroundColor="primaryBackground"
        justifyContent="center"
      >
        {icon !== undefined && icon}
        <Text variant="textXsRegular" textAlign="center" color="secondaryText">
          {title}
        </Text>
      </Box>
    ),
    [],
  )

  return (
    <ScrollBox
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={refetch}
          title=""
          tintColor={colors.primaryText}
        />
      }
    >
      <SectionList
        renderSectionHeader={renderSectionHeader}
        ListHeaderComponent={
          <>
            {header}
            <Box
              flexDirection="row"
              justifyContent="center"
              alignItems="center"
              paddingVertical="5"
            >
              <Text variant="textXsRegular" color="secondaryText">
                Positions
              </Text>
            </Box>
            <Box
              flex={1}
              flexDirection="row"
              backgroundColor="bg.tertiary"
              alignItems="center"
              justifyContent="center"
              borderRadius="2xl"
              padding="3"
              marginBottom="4"
              paddingLeft="0"
              {...boxProps}
            >
              <LightningBolt
                color={colors['blue.light-500']}
                height={36}
                width={36}
              />
              <Box flexShrink={1}>
                <Text variant="textSmRegular" color="secondaryText">
                  Increase your voting power by locking tokens
                </Text>
              </Box>
            </Box>
          </>
        }
        keyExtractor={keyExtractor}
        sections={loading ? [] : SectionData}
        renderItem={renderItem}
        ListEmptyComponent={renderEmptyComponent}
      />
    </ScrollBox>
  )
}

const POSITION_HEIGHT = 120
