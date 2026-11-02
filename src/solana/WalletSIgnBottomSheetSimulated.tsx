import { SubmitButton } from '@ui/SubmitButton'
import { WarningPill } from '@ui/WarningPill'
import { entityCreatorKey } from '@helium/helium-entity-manager-sdk'
import { useSolOwnedAmount } from '@helium/helium-react-hooks'
import { sus } from '@helium/sus'
import { useBN } from '@hooks/useBN'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import { useRentExempt } from '@hooks/useRentExempt'
import { Button } from '@ui/Button'
import { PressableScale } from '@ui/PressableScale'
import { Spinner } from '@ui/Spinner'
import { Text } from '@ui/Text'
import { twMerge } from '@ui/twMerge'
import { DAO_KEY } from '@utils/constants'
import { humanReadable } from '@utils/formatting'
import BN from 'bn.js'
import {
  Check,
  ChevronDown,
  ChevronUp,
  CornerDownRight,
  Info,
  X,
} from 'lucide-react-native'
import React, { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { withUniwind } from 'uniwind'
import { fetchCanopyBlacklist } from './canopyBlacklist'
import { useSolana } from './SolanaProvider'
import WalletSignBottomSheetTransaction from './WalletSignBottomSheetTransaction'
import {
  WalletSignOpts,
  WalletStandardMessageTypes,
} from './walletSignBottomSheetTypes'

const CheckIcon = withUniwind(Check)
const ChevronDownIcon = withUniwind(ChevronDown)
const ChevronUpIcon = withUniwind(ChevronUp)
const IndentArrowIcon = withUniwind(CornerDownRight)
const InfoIcon = withUniwind(Info)
const CancelIcon = withUniwind(X)

// How long Approve waits for a simulation that does not return or fail
export const SIMULATION_TIMEOUT_MS = 30_000

type IWalletSignBottomSheetSimulatedProps = WalletSignOpts & {
  // The sheet's open animation has ended
  opened: boolean
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
  opened,
  onAccept,
  onCancel,
}: IWalletSignBottomSheetSimulatedProps) => {
  const { t } = useTranslation()
  const { connection, cluster } = useSolana()
  const wallet = useCurrentWallet()
  const solBalance = useBN(useSolOwnedAmount(wallet).amount)
  const { rentExempt, rentExemptLamports } = useRentExempt()

  const [infoVisible, setInfoVisible] = useState(false)
  const [writableInfoVisible, setWritableInfoVisible] = useState(false)
  const [feesExpanded, setFeesExpanded] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  // The transactions whose simulation timed out, so a new request waits again
  const [timedOutTxs, setTimedOutTxs] =
    useState<WalletSignOpts['serializedTxs']>()

  const { data: accountBlacklist } = useQuery({
    queryKey: ['wellKnownCanopyBlacklist'],
    queryFn: fetchCanopyBlacklist,
  })

  const {
    data: simulationResults,
    error,
    isLoading: loading,
    isPending,
  } = useQuery({
    queryKey: [
      'walletSignSimulation',
      cluster,
      wallet?.toBase58(),
      serializedTxs?.map((tx) => tx.toString('base64')),
    ],
    enabled: !!connection && !!wallet && !!serializedTxs && !!accountBlacklist,
    // A failed simulation fails the same way again; show it at once
    retry: false,
    staleTime: 0,
    gcTime: 0,
    queryFn: async () => {
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
      return null
    },
  })

  const itemsPerPage = 5
  const pages = Math.ceil((simulationResults?.length || 0) / itemsPerPage)
  const currentTxs = simulationResults
    ? simulationResults.slice(0, currentPage * itemsPerPage)
    : []
  const hasMore = !!simulationResults && currentPage < pages

  const handleLoadMore = () => {
    setCurrentPage((page) => page + 1)
  }

  const estimatedTotalLamports =
    simulationResults?.reduce(
      (a, b) => a + b.solFee + (b.priorityFee || 0),
      0,
    ) || 0

  const estimatedTotalSol =
    loading || !simulationResults
      ? '...'
      : humanReadable(new BN(estimatedTotalLamports), 9)

  const estimatedTotalBaseFee = humanReadable(
    new BN(simulationResults?.reduce((a, b) => a + b.solFee, 0) || 0),
    9,
  )

  const estimatedTotalPriorityFee = humanReadable(
    new BN(
      simulationResults?.reduce((a, b) => a + (b.priorityFee || 0), 0) || 0,
    ),
    9,
  )

  const totalWarnings = simulationResults?.reduce(
    (a, b) =>
      a +
      (b.warnings.filter((w) => w.severity === 'critical').length > 0 ? 1 : 0),
    0,
  )

  const worstSeverity = simulationResults
    ? simulationResults.reduce((a, b) => {
        if (a === 'critical') {
          return 'critical'
        }
        if (b.warnings.some((w) => w.severity === 'critical')) {
          return 'critical'
        }

        return a
      }, 'warning')
    : 'critical'

  const insufficientRentExempt = solBalance
    ? new BN(solBalance.toString())
        .sub(new BN(estimatedTotalLamports))
        .lt(new BN(rentExemptLamports))
    : undefined

  const insufficientFunds =
    new BN(estimatedTotalLamports).gt(new BN(solBalance?.toString() || '0')) ||
    simulationResults?.some((r) => r.insufficientFunds)

  // isPending, not isLoading: a query still waiting to be enabled is pending
  // but not loading. A request without transactions has nothing to simulate
  const simulationPending = !!serializedTxs && isPending
  const simulationTimedOut = simulationPending && timedOutTxs === serializedTxs
  const approveDisabled = !opened || (simulationPending && !simulationTimedOut)

  useEffect(() => {
    if (!simulationPending) return undefined
    const timer = setTimeout(
      () => setTimedOutTxs(serializedTxs),
      SIMULATION_TIMEOUT_MS,
    )
    return () => clearTimeout(timer)
  }, [simulationPending, serializedTxs])

  const Chevron = feesExpanded ? ChevronUpIcon : ChevronDownIcon
  const showWarnings =
    totalWarnings && !suppressWarnings && worstSeverity === 'critical'

  return (
    <View className="p-4">
      {header || url ? (
        <View className="mb-2">
          {header ? (
            <Text size="xl" className="font-medium">
              {header}
            </Text>
          ) : null}
          {url ? (
            <Text
              size="base"
              className="text-center font-medium text-muted-foreground"
            >
              {url || ''}
            </Text>
          ) : null}
        </View>
      ) : null}
      {type === WalletStandardMessageTypes.connect && (
        <View className="grow justify-center">
          <View className="flex-col rounded-xl bg-secondary p-4">
            <View className="mb-4 flex-row">
              <CheckIcon size={20} colorClassName="accent-foreground" />
              <Text size="base" className="ms-2">
                {t('browserScreen.connectBullet1')}
              </Text>
            </View>
            <View className="flex-row">
              <CheckIcon size={20} colorClassName="accent-foreground" />
              <Text size="base" className="ms-2">
                {t('browserScreen.connectBullet2')}
              </Text>
            </View>
          </View>
          <View>
            <Text
              size="base"
              className="mt-4 text-center text-muted-foreground"
            >
              {t('browserScreen.connectToWebsitesYouTrust')}
            </Text>
          </View>
        </View>
      )}
      {(type === WalletStandardMessageTypes.signMessage ||
        type === WalletStandardMessageTypes.signAndSendTransaction ||
        type === WalletStandardMessageTypes.signTransaction) && (
        <View className="grow justify-center">
          {warning && (
            <View className="mb-4 rounded-xl bg-secondary p-4">
              <Text size="base" className="font-medium text-warning-500">
                {warning}
              </Text>
            </View>
          )}

          <View className="max-h-[500px] flex-col">
            <ScrollView contentInsetAdjustmentBehavior="automatic">
              <View className="flex-row items-center">
                <Text size="lg" className="mr-2 font-medium">
                  {t('browserScreen.estimatedChanges')}
                </Text>
                <PressableScale
                  feedback="opacity"
                  onPress={() => setInfoVisible((prev) => !prev)}
                >
                  <InfoIcon
                    size={15}
                    colorClassName="accent-muted-foreground"
                  />
                </PressableScale>
              </View>
              {infoVisible && (
                <Text size="xs" className="mt-2">
                  {t('browserScreen.estimatedChangesDescription')}
                </Text>
              )}

              {!(insufficientFunds || insufficientRentExempt) && message && (
                <Text
                  size="base"
                  className="my-2 font-medium text-muted-foreground"
                >
                  {message}
                </Text>
              )}

              {showWarnings ? (
                <View className="my-2 flex-row justify-start">
                  <WarningPill
                    text={t('browserScreen.suspiciousActivity', {
                      num: totalWarnings,
                    })}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    variant={worstSeverity as any}
                  />
                </View>
              ) : null}

              {(insufficientFunds || insufficientRentExempt) && (
                <View className="my-2 flex-row justify-start">
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
                </View>
              )}

              <View className="mt-2 flex-row justify-between">
                <View className="grow flex-row items-center">
                  <Text size="base" className="mr-2 font-medium">
                    {t('browserScreen.writableAccounts')}
                  </Text>
                  <PressableScale
                    feedback="opacity"
                    onPress={() => setWritableInfoVisible((prev) => !prev)}
                  >
                    <InfoIcon
                      size={15}
                      colorClassName="accent-muted-foreground"
                    />
                  </PressableScale>
                </View>
                <Text size="base" className="text-muted-foreground">
                  {t('browserScreen.transactions', {
                    num: simulationResults?.length || 1,
                  })}
                </Text>
              </View>
              {writableInfoVisible && (
                <Text size="xs" className="mt-2">
                  {t('browserScreen.writableAccountsDescription')}
                </Text>
              )}

              <View className="flex-1 pt-4">
                {loading && !simulationTimedOut && <Spinner />}
                {simulationTimedOut ? (
                  <View className="mb-4">
                    <View className="rounded-b-xl bg-secondary p-4">
                      <Text
                        size="base"
                        className="font-medium text-destructive"
                      >
                        {t('browserScreen.unableToSimulate')}
                      </Text>
                    </View>
                  </View>
                ) : null}
                {error ? (
                  <View className="mb-4">
                    <View className="rounded-b-xl bg-secondary p-4">
                      <Text
                        size="base"
                        className={
                          loading
                            ? 'font-medium'
                            : 'font-medium text-destructive'
                        }
                      >
                        {error.message || error.toString()}
                      </Text>
                    </View>
                  </View>
                ) : null}
                {currentTxs && (
                  <>
                    {currentTxs.map((tx, idx) => (
                      <WalletSignBottomSheetTransaction
                        key={`transaction-${idx}`}
                        transaction={tx}
                        transactionIdx={idx}
                        totalTransactions={serializedTxs?.length || 0}
                      />
                    ))}
                    {hasMore && (
                      <Button
                        variant="secondary"
                        className="w-full rounded-full"
                        onPress={handleLoadMore}
                      >
                        {t('generic.loadMore')}
                      </Button>
                    )}
                  </>
                )}
              </View>
            </ScrollView>
            {(type === WalletStandardMessageTypes.signAndSendTransaction ||
              type === WalletStandardMessageTypes.signTransaction) && (
              <View className="flex-col">
                <PressableScale
                  feedback="opacity"
                  onPress={() => setFeesExpanded(!feesExpanded)}
                  className="mt-2 flex-row justify-between"
                >
                  <Text size="base" className="font-bold">
                    {t('browserScreen.totalNetworkFee')}
                  </Text>
                  <View className="flex-row items-center">
                    <Text
                      size="base"
                      className="font-medium text-blue-dark-500"
                    >
                      {`~${estimatedTotalSol} SOL`}
                    </Text>
                    <Chevron
                      size={20}
                      colorClassName="accent-muted-foreground"
                    />
                  </View>
                </PressableScale>
                {feesExpanded ? (
                  <View className="pr-6">
                    <View className="mt-2 flex-row justify-between">
                      <View className="flex-row">
                        <IndentArrowIcon
                          size={16}
                          colorClassName="accent-muted-foreground"
                        />
                        <Text
                          size="base"
                          className="ml-2 text-muted-foreground"
                        >
                          {t('browserScreen.totalBaseFee')}
                        </Text>
                      </View>

                      <Text size="base" className="text-blue-dark-500">
                        {`~${estimatedTotalBaseFee} SOL`}
                      </Text>
                    </View>
                    <View className="mt-2 flex-row justify-between">
                      <View className="flex-row">
                        <IndentArrowIcon
                          size={16}
                          colorClassName="accent-muted-foreground"
                        />
                        <Text
                          size="base"
                          className="ml-2 text-muted-foreground"
                        >
                          {t('browserScreen.totalPriorityFee')}
                        </Text>
                      </View>

                      <Text size="base" className="text-blue-dark-500">
                        {`~${estimatedTotalPriorityFee} SOL`}
                      </Text>
                    </View>
                  </View>
                ) : null}
              </View>
            )}
          </View>
        </View>
      )}
      {showWarnings ? (
        <View
          className={twMerge(
            'flex-row items-center justify-start',
            feesExpanded ? 'mt-2' : 'mt-4',
          )}
        >
          <View className="flex-1">
            <SubmitButton
              color="destructive"
              backgroundColor="background"
              title={
                type === WalletStandardMessageTypes.connect
                  ? t('browserScreen.connect')
                  : t('browserScreen.swipeToApprove')
              }
              disabled={approveDisabled}
              onSubmit={onAccept}
            />
          </View>
          <Button
            variant="secondary"
            className="ml-2 size-[65px] rounded-full px-0"
            onPress={onCancel}
          >
            <CancelIcon
              size={24}
              colorClassName="accent-secondary-foreground"
            />
          </Button>
        </View>
      ) : (
        <View
          className={twMerge(
            'flex-row justify-between',
            feesExpanded ? 'mt-2' : 'mt-4',
          )}
        >
          <Button
            variant="outline"
            size="lg"
            className="w-[48%] rounded-full"
            onPress={onCancel}
          >
            {t('browserScreen.cancel')}
          </Button>

          <Button
            variant="cta"
            size="lg"
            className="w-[48%] rounded-full"
            disabled={approveDisabled}
            onPress={onAccept}
          >
            {type === WalletStandardMessageTypes.connect
              ? t('browserScreen.connect')
              : t('browserScreen.approve')}
          </Button>
        </View>
      )}
    </View>
  )
}
