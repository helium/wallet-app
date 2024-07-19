import CancelIcon from '@assets/images/remixCancel.svg'
import Box from '@components/Box'
import SubmitButton from '@components/SubmitButton'
import Text from '@components/Text'
import { useSolOwnedAmount } from '@helium/helium-react-hooks'
import { useBN } from '@hooks/useBN'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import { useRentExempt } from '@hooks/useRentExempt'
import axios from 'axios'
import React, { ReactNode, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAsync } from 'react-async-hook'
import { DAO_KEY } from '@utils/constants'
import { entityCreatorKey } from '@helium/helium-entity-manager-sdk'
import { humanReadable } from '@helium/spl-utils'
import BN from 'bn.js'
import { useSolana } from './SolanaProvider'
import {
  WalletSignOptsCommon,
  WalletSignOptsSimulated,
} from './walletSignBottomSheetTypes'

interface IWalletSignBottomSheetSimulatedProps
  extends WalletSignOptsCommon,
    WalletSignOptsSimulated {
  children?: ReactNode
}
const WELL_KNOWN_CANOPY_URL =
  'https://shdw-drive.genesysgo.net/6tcnBSybPG7piEDShBcrVtYJDPSvGrDbVvXmXKpzBvWP/merkles.json'
let wellKnownCanopyCache: Record<string, number> | undefined

export const WalletSignBottomSheetSimulated = ({
  url,
  type,
  header,
  warning,
  serializedTxs,
  suppressWarnings,
  additionalMessage,
  onCancelHandler,
  onAcceptHandler,
  children,
}: IWalletSignBottomSheetSimulatedProps) => {
  const { t } = useTranslation()
  const { connection, cluster } = useSolana()
  const wallet = useCurrentWallet()
  const [feesExpanded, setFeesExpanded] = useState(false)
  const solBalance = useBN(useSolOwnedAmount(wallet).amount)
  const { rentExempt } = useRentExempt()

  const [infoVisible, setInfoVisible] = useState(false)
  const [writableInfoVisible, setWritableInfoVisible] = useState(false)
  const [feesExpanded, setFeesExpanded] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const { result: accountBlacklist } = useAsync(async () => {
    if (!wellKnownCanopyCache)
      wellKnownCanopyCache = await (await axios.get(WELL_KNOWN_CANOPY_URL)).data

    if (wellKnownCanopyCache) {
      return new Set(Object.keys(wellKnownCanopyCache))
    }

    return new Set([])
  }, [])

  const {
    result: simulationResults,
    error,
    loading,
  } = useAsync(async () => {
    if (
      connection &&
      wallet &&
      walletSignOpts.serializedTxs &&
      accountBlacklist
    ) {
      return sus({
        connection,
        wallet,
        serializedTransactions: walletSignOpts.serializedTxs,
        checkCNfts: true,
        cluster,
        extraSearchAssetParams: {
          creatorVerified: true,
          creatorAddress: entityCreatorKey(DAO_KEY)[0].toBase58(),
        },
        accountBlacklist,
      })
    }
  }, [cluster, connection, wallet, accountBlacklist, serializedTxs])

  const [currentTxs, hasMore] = useMemo(() => {
    if (!simulationResults) return [[], false]

    let scopedTxs
    const itemsPerPage = 5
    const pages = Math.ceil((simulationResults.length || 0) / itemsPerPage)
    const more = currentPage < pages

    if (simulationResults) {
      const endIndex = currentPage * itemsPerPage
      scopedTxs = simulationResults.slice(0, endIndex)
    }

    return [scopedTxs, more]
  }, [simulationResults, currentPage])

  const handleLoadMore = useCallback(() => {
    setCurrentPage((page) => page + 1)
  }, [setCurrentPage])

  const estimatedTotalLamports = useMemo(
    () =>
      simulationResults?.reduce(
        (a, b) => a + b.solFee + (b.priorityFee || 0),
        0,
      ) || 0,
    [simulationResults],
  )

  const estimatedTotalSol = useMemo(
    () => (loading ? '...' : humanReadable(new BN(estimatedTotalLamports), 9)),
    [estimatedTotalLamports, loading],
  )

  const estimatedTotalBaseFee = useMemo(
    () =>
      humanReadable(
        new BN(simulationResults?.reduce((a, b) => a + b.solFee, 0) || 0),
        9,
      ),
    [simulationResults],
  )

  const estimatedTotalPriorityFee = useMemo(
    () =>
      humanReadable(
        new BN(
          simulationResults?.reduce((a, b) => a + (b.priorityFee || 0), 0) || 0,
        ),
        9,
      ),
    [simulationResults],
  )

  const totalWarnings = useMemo(
    () =>
      simulationResults?.reduce(
        (a, b) =>
          a +
          (b.warnings.filter((w) => w.severity === 'critical').length > 0
            ? 1
            : 0),
        0,
      ),
    [simulationResults],
  )

  const worstSeverity = useMemo(() => {
    if (simulationResults) {
      return simulationResults?.reduce((a, b) => {
        if (a === 'critical') {
          return 'critical'
        }
        if (b.warnings.some((w) => w.severity === 'critical')) {
          return 'critical'
        }

        return a
      }, 'warning')
    }
    return 'critical'
  }, [simulationResults])

  const insufficientRentExempt = useMemo(() => {
    if (solBalance) {
      return new BN(solBalance.toString())
        .sub(new BN(estimatedTotalLamports))
        .lt(new BN(rentExempt || 0))
    }
  }, [solBalance, estimatedTotalLamports, rentExempt])

  const insufficientFunds = useMemo(
    () =>
      new BN(estimatedTotalLamports).gt(
        new BN(solBalance?.toString() || '0'),
      ) || simulationResults?.some((r) => r.insufficientFunds),
    [solBalance, estimatedTotalLamports, simulationResults],
  )

  const showWarnings =
    totalWarnings && !suppressWarnings && worstSeverity === 'critical'

  return (
    <Box
      padding="l"
      backgroundColor="white"
      borderRadius="xl"
      marginBottom="m"
      alignItems="center"
    >
      <Text variant="h3" marginBottom="s">
        {header}
      </Text>
      {children}
      {showWarnings ? (
        <Box
          flexDirection="row"
          justifyContent="flex-start"
          alignItems="center"
          mt={feesExpanded ? 's' : 'm'}
        >
          <Box flex={1}>
            <SubmitButton
              color="matchaRed500"
              backgroundColor="white"
              title={
                type === WalletStandardMessageTypes.connect
                  ? t('browserScreen.connect')
                  : t('browserScreen.swipeToApprove')
              }
              onSubmit={onAcceptHandler}
            />
          </Box>
          <ButtonPressable
            ml="s"
            width={65}
            height={65}
            innerContainerProps={{
              justifyContent: 'center',
            }}
            borderRadius="round"
            backgroundColor="black200"
            Icon={CancelIcon}
            onPress={onCancelHandler}
          />
        </Box>
      ) : (
        <Box
          flexDirection="row"
          justifyContent="space-between"
          mt={feesExpanded ? 's' : 'm'}
        >
          <ButtonPressable
            width="48%"
            borderRadius="round"
            backgroundColor="white"
            backgroundColorOpacity={0.1}
            backgroundColorOpacityPressed={0.05}
            titleColorPressedOpacity={0.3}
            titleColor="white"
            title={t('browserScreen.cancel')}
            onPress={onCancelHandler}
          />

          <ButtonPressable
            width="48%"
            borderRadius="round"
            backgroundColor="white"
            backgroundColorOpacityPressed={0.7}
            backgroundColorDisabled="surfaceSecondary"
            backgroundColorDisabledOpacity={0.5}
            titleColorDisabled="secondaryText"
            title={
              type === WalletStandardMessageTypes.connect
                ? t('browserScreen.connect')
                : t('browserScreen.approve')
            }
            titleColor="black"
            onPress={onAcceptHandler}
          />
        </Box>
      )}
    </Box>
  )
}
