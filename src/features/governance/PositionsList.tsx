import LightningBolt from '@assets/images/transactions.svg'
import Box from '@components/Box'
import { CardSkeleton } from '@components/CardSkeleton'
import Text from '@components/Text'
import {
  PositionWithMeta,
  useSubDaos,
} from '@helium/voter-stake-registry-hooks'
import { BoxProps } from '@shopify/restyle'
import { useGovernance } from '@storage/GovernanceProvider'
import { Theme } from '@theme/theme'
import { useColors } from '@theme/themeHooks'
import { times } from 'lodash'
import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { RefreshControl, SectionList } from 'react-native'
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
          marginTop={idx > 0 ? 'm' : 'none'}
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
        backgroundColor="surfaceSecondary"
        borderRadius="l"
        height={POSITION_HEIGHT}
        width="100%"
        justifyContent="center"
        alignItems="center"
        mb="m"
      >
        <Text variant="body1" color="white">
          {t('gov.positions.noneFound')}
        </Text>
      </Box>
    )
  }, [loading, positions, t])

  const SectionData = useMemo(() => {
    return [
      { title: 'My Positions', data: unProxiedPositions || [] },
      { title: 'Proxied To Me', data: proxiedPositions || [] },
    ]
  }, [proxiedPositions, unProxiedPositions])

  const renderSectionHeader = useCallback(
    ({ section: { title, icon } }) => (
      <Box
        flexDirection="row"
        alignItems="center"
        paddingTop="xl"
        paddingBottom="m"
        paddingHorizontal="l"
        backgroundColor="primaryBackground"
        justifyContent="center"
      >
        {icon !== undefined && icon}
        <Text variant="body3" textAlign="center" color="secondaryText">
          {title}
        </Text>
      </Box>
    ),
    [],
  )

  return (
    <SectionList
      renderSectionHeader={renderSectionHeader}
      ListHeaderComponent={
        <>
          {header}
          <Box
            flexDirection="row"
            justifyContent="center"
            alignItems="center"
            paddingVertical="lm"
          >
            <Text variant="body3" color="secondaryText">
              Positions
            </Text>
          </Box>
          <Box
            flex={1}
            flexDirection="row"
            backgroundColor="surfaceSecondary"
            alignItems="center"
            justifyContent="center"
            borderRadius="l"
            padding="ms"
            marginBottom="m"
            paddingLeft="none"
            {...boxProps}
          >
            <LightningBolt
              color={colors.blueBright500}
              height={36}
              width={36}
            />
            <Box flexShrink={1}>
              <Text variant="body2" color="secondaryText">
                Increase your voting power by locking tokens
              </Text>
            </Box>
          </Box>
        </>
      }
      keyExtractor={keyExtractor}
      sections={SectionData}
      renderItem={renderItem}
      ListEmptyComponent={renderEmptyComponent}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={refetch}
          title=""
          tintColor={colors.primaryText}
        />
      }
    />
  )
}

const POSITION_HEIGHT = 120
