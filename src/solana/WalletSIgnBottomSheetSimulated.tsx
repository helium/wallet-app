import Checkmark from '@assets/images/checkmark.svg'
import IndentArrow from '@assets/images/indentArrow.svg'
import InfoIcon from '@assets/images/info.svg'
import CancelIcon from '@assets/images/remixCancel.svg'
import ChevronDown from '@assets/images/remixChevronDown.svg'
import ChevronUp from '@assets/images/remixChevronUp.svg'
import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import CircleLoader from '@components/CircleLoader'
import SubmitButton from '@components/SubmitButton'
import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { WarningPill } from '@components/WarningPill'
import { entityCreatorKey } from '@helium/helium-entity-manager-sdk'
import { useSolOwnedAmount } from '@helium/helium-react-hooks'
import { humanReadable } from '@helium/spl-utils'
import { sus } from '@helium/sus'
import { useBN } from '@hooks/useBN'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import { useRentExempt } from '@hooks/useRentExempt'
import { DAO_KEY } from '@utils/constants'
import axios from 'axios'
import BN from 'bn.js'
import React, { useCallback, useMemo, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native-gesture-handler'
import { useSolana } from './SolanaProvider'
import WalletSignBottomSheetTransaction from './WalletSignBottomSheetTransaction'
import {
  WalletSignOptsSimulated,
  WalletStandardMessageTypes,
} from './walletSignBottomSheetTypes'

const WELL_KNOWN_CANOPY_URL =
  'https://shdw-drive.genesysgo.net/6tcnBSybPG7piEDShBcrVtYJDPSvGrDbVvXmXKpzBvWP/merkles.json'
let wellKnownCanopyCache: Record<string, number> | undefined

type IWalletSignBottomSheetSimulatedProps = WalletSignOptsSimulated & {
  onCancel: () => void
  onAccept: () => void
}

export const WalletSignBottomSheetSimulated = ({
  url,
  type,
  header,
  warning,
  serializedTxs,
  suppressWarnings,
  message,
  onAccept,
  onCancel,
}: IWalletSignBottomSheetSimulatedProps) => {
  const { t } = useTranslation()
  const { connection, cluster } = useSolana()
  const wallet = useCurrentWallet()
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
    if (connection && wallet && serializedTxs && accountBlacklist) {
      return sus({
        connection,
        wallet,
        serializedTransactions: serializedTxs,
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

  const Chevron = feesExpanded ? ChevronUp : ChevronDown
  const showWarnings =
    totalWarnings && !suppressWarnings && worstSeverity === 'critical'

  return (
    <Box p="m">
      {header || url ? (
        <Box marginBottom="l">
          {header ? (
            <Text variant="h4Medium" color="white" textAlign="center">
              {header}
            </Text>
          ) : null}
          {url ? (
            <Text
              variant="body1Medium"
              color="secondaryText"
              textAlign="center"
            >
              {url || ''}
            </Text>
          ) : null}
        </Box>
      ) : null}
      {type === WalletStandardMessageTypes.connect && (
        <Box flexGrow={1} justifyContent="center">
          <Box
            borderRadius="l"
            backgroundColor="secondaryBackground"
            flexDirection="column"
            padding="m"
          >
            <Box flexDirection="row" marginBottom="m">
              <Checkmark color="white" />
              <Text variant="body1" marginStart="s">
                {t('browserScreen.connectBullet1')}
              </Text>
            </Box>
            <Box flexDirection="row">
              <Checkmark color="white" />
              <Text marginStart="s" variant="body1">
                {t('browserScreen.connectBullet2')}
              </Text>
            </Box>
          </Box>
          <Box>
            <Text
              variant="body1"
              color="secondaryText"
              textAlign="center"
              marginTop="m"
            >
              {t('browserScreen.connectToWebsitesYouTrust')}
            </Text>
          </Box>
        </Box>
      )}
      {(type === WalletStandardMessageTypes.signMessage ||
        type === WalletStandardMessageTypes.signAndSendTransaction ||
        type === WalletStandardMessageTypes.signTransaction) && (
        <Box flexGrow={1} justifyContent="center">
          {warning && (
            <Box
              borderRadius="l"
              backgroundColor="secondaryBackground"
              padding="m"
              marginBottom="m"
            >
              <Text variant="body1Medium" color="orange500">
                {warning}
              </Text>
            </Box>
          )}

          <Box flexDirection="column" maxHeight={500}>
            <ScrollView>
              <Box flexDirection="row" alignItems="center">
                <Text variant="subtitle2" mr="s">
                  {t('browserScreen.estimatedChanges')}
                </Text>
                <TouchableOpacityBox
                  onPress={() => setInfoVisible((prev) => !prev)}
                >
                  <InfoIcon width={15} height={15} />
                </TouchableOpacityBox>
              </Box>
              {infoVisible && (
                <Text mt="s" variant="body3" color="white">
                  {t('browserScreen.estimatedChangesDescription')}
                </Text>
              )}

              {!(insufficientFunds || insufficientRentExempt) && message && (
                <Text mt="s" mb="s" variant="body1Medium" color="secondaryText">
                  {message}
                </Text>
              )}

              {showWarnings ? (
                <Box
                  marginVertical="s"
                  flexDirection="row"
                  justifyContent="flex-start"
                >
                  <WarningPill
                    text={t('browserScreen.suspiciousActivity', {
                      num: totalWarnings,
                    })}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    variant={worstSeverity as any}
                  />
                </Box>
              ) : null}

              {(insufficientFunds || insufficientRentExempt) && (
                <Box
                  marginVertical="s"
                  flexDirection="row"
                  justifyContent="flex-start"
                >
                  <WarningPill
                    text={
                      insufficientFunds
                        ? t('browserScreen.insufficientFunds')
                        : t('browserScreen.insufficientRentExempt', {
                            amount: rentExempt,
                          })
                    }
                    variant="critical"
                  />
                </Box>
              )}

              <Box
                flexDirection="row"
                justifyContent="space-between"
                marginTop="s"
              >
                <Box flexGrow={1} flexDirection="row" alignItems="center">
                  <Text variant="subtitle3" mr="s">
                    {t('browserScreen.writableAccounts')}
                  </Text>
                  <TouchableOpacityBox
                    onPress={() => setWritableInfoVisible((prev) => !prev)}
                  >
                    <InfoIcon width={15} height={15} />
                  </TouchableOpacityBox>
                </Box>
                <Text variant="body1" color="grey50">
                  {t('browserScreen.transactions', {
                    num: simulationResults?.length || 1,
                  })}
                </Text>
              </Box>
              {writableInfoVisible && (
                <Text mt="s" variant="body3" color="white">
                  {t('browserScreen.writableAccountsDescription')}
                </Text>
              )}

              <Box flex={1} paddingTop="m">
                {loading && <CircleLoader />}
                {error ? (
                  <Box marginBottom="m">
                    <Box>
                      <Box
                        borderBottomStartRadius="l"
                        borderBottomEndRadius="l"
                        backgroundColor="secondaryBackground"
                        padding="m"
                      >
                        <Text
                          variant="body1Medium"
                          color={loading ? 'white' : 'matchaRed500'}
                        >
                          {error.message || error.toString()}
                        </Text>
                      </Box>
                    </Box>
                  </Box>
                ) : null}
                {currentTxs && (
                  <>
                    {currentTxs.map((tx, idx) => (
                      <WalletSignBottomSheetTransaction
                        // eslint-disable-next-line react/no-array-index-key
                        key={`transaction-${idx}`}
                        transaction={tx}
                        transactionIdx={idx}
                        totalTransactions={serializedTxs?.length || 0}
                      />
                    ))}
                    {hasMore && (
                      <ButtonPressable
                        width="100%"
                        borderRadius="round"
                        backgroundColor="white"
                        backgroundColorOpacity={0.1}
                        backgroundColorOpacityPressed={0.05}
                        titleColorPressedOpacity={0.3}
                        titleColor="white"
                        title={t('generic.loadMore')}
                        onPress={handleLoadMore}
                      />
                    )}
                  </>
                )}
              </Box>
            </ScrollView>
            {(type === WalletStandardMessageTypes.signAndSendTransaction ||
              type === WalletStandardMessageTypes.signTransaction) && (
              <Box flexDirection="column">
                <TouchableOpacityBox
                  onPress={() => setFeesExpanded(!feesExpanded)}
                  marginTop="s"
                  flexDirection="row"
                  justifyContent="space-between"
                >
                  <Text variant="body1Bold">
                    {t('browserScreen.totalNetworkFee')}
                  </Text>
                  <Box flexDirection="row">
                    <Text variant="body1Medium" color="blue500">
                      {`~${estimatedTotalSol} SOL`}
                    </Text>
                    <Chevron color="grey500" />
                  </Box>
                </TouchableOpacityBox>
                {feesExpanded ? (
                  <Box paddingRight="l">
                    <Box
                      marginTop="s"
                      flexDirection="row"
                      justifyContent="space-between"
                    >
                      <Box flexDirection="row">
                        <IndentArrow />
                        <Text variant="body1" ml="s" color="grey50">
                          {t('browserScreen.totalBaseFee')}
                        </Text>
                      </Box>

                      <Text variant="body1" color="blue500">
                        {`~${estimatedTotalBaseFee} SOL`}
                      </Text>
                    </Box>
                    <Box
                      marginTop="s"
                      flexDirection="row"
                      justifyContent="space-between"
                    >
                      <Box flexDirection="row">
                        <IndentArrow />
                        <Text variant="body1" ml="s" color="grey50">
                          {t('browserScreen.totalPriorityFee')}
                        </Text>
                      </Box>

                      <Text variant="body1" color="blue500">
                        {`~${estimatedTotalPriorityFee} SOL`}
                      </Text>
                    </Box>
                  </Box>
                ) : null}
              </Box>
            )}
          </Box>
        </Box>
      )}
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
              onSubmit={onAccept}
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
            onPress={onCancel}
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
            onPress={onCancel}
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
            onPress={onAccept}
          />
        </Box>
      )}
    </Box>
  )
}
