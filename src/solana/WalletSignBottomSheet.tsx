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
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet'
import { entityCreatorKey } from '@helium/helium-entity-manager-sdk'
import { useSolOwnedAmount } from '@helium/helium-react-hooks'
import { sus } from '@helium/sus'
import { useBN } from '@hooks/useBN'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import { useRentExempt } from '@hooks/useRentExempt'
import { useColors, useOpacity } from '@theme/themeHooks'
import { DAO_KEY } from '@utils/constants'
import { humanReadable } from '@utils/solanaUtils'
import axios from 'axios'
import BN from 'bn.js'
import React, {
  Ref,
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { TouchableOpacity } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { useSharedValue } from 'react-native-reanimated'
import { useSolana } from './SolanaProvider'
import WalletSignBottomSheetTransaction from './WalletSignBottomSheetTransaction'
import {
  WalletSignBottomSheetProps,
  WalletSignBottomSheetRef,
  WalletSignOpts,
  WalletStandardMessageTypes,
} from './walletSignBottomSheetTypes'

let promiseResolve: (value: boolean | PromiseLike<boolean>) => void

const WELL_KNOWN_CANOPY_URL =
  'https://shdw-drive.genesysgo.net/6tcnBSybPG7piEDShBcrVtYJDPSvGrDbVvXmXKpzBvWP/merkles.json'
let wellKnownCanopyCache: Record<string, number> | undefined

const WalletSignBottomSheet = forwardRef(
  (
    { onClose, children }: WalletSignBottomSheetProps,
    ref: Ref<WalletSignBottomSheetRef>,
  ) => {
    useImperativeHandle(ref, () => ({ show, hide }))
    const { rentExempt } = useRentExempt()
    const { backgroundStyle } = useOpacity('surfaceSecondary', 1)
    const { secondaryText } = useColors()
    const { t } = useTranslation()
    const wallet = useCurrentWallet()
    const solBalance = useBN(useSolOwnedAmount(wallet).amount)
    const bottomSheetModalRef = useRef<BottomSheetModal>(null)
    const [isVisible, setIsVisible] = useState(false)
    const [infoVisible, setInfoVisible] = useState(false)
    const [writableInfoVisible, setWritableInfoVisible] = useState(false)
    const [walletSignOpts, setWalletSignOpts] = useState<WalletSignOpts>({
      type: WalletStandardMessageTypes.connect,
      url: '',
      additionalMessage: '',
      serializedTxs: undefined,
      header: undefined,
      suppressWarnings: false,
    })
    const { connection, cluster } = useSolana()
    const { result: accountBlacklist } = useAsync(async () => {
      if (!wellKnownCanopyCache)
        wellKnownCanopyCache = await (
          await axios.get(WELL_KNOWN_CANOPY_URL)
        ).data

      if (wellKnownCanopyCache) {
        return new Set(Object.keys(wellKnownCanopyCache))
      }

      return new Set([])
    }, [])
    const [feesExpanded, setFeesExpanded] = useState(false)
    const Chevron = feesExpanded ? ChevronUp : ChevronDown

    const itemsPerPage = 5
    const [currentPage, setCurrentPage] = useState(1)
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
    }, [
      walletSignOpts.serializedTxs,
      cluster,
      connection,
      wallet,
      accountBlacklist,
    ])
    const [currentTxs, hasMore] = useMemo(() => {
      if (simulationResults) {
        const totalPages = Math.ceil(
          (simulationResults.length || 0) / itemsPerPage,
        )
        const more = currentPage < totalPages
        let scopedTxs

        if (simulationResults) {
          const endIndex = currentPage * itemsPerPage
          scopedTxs = simulationResults.slice(0, endIndex)
        }

        return [scopedTxs, more]
      }
      return [[], false]
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
      () =>
        loading ? '...' : humanReadable(new BN(estimatedTotalLamports), 9),
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
            simulationResults?.reduce((a, b) => a + (b.priorityFee || 0), 0) ||
              0,
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

    const animatedContentHeight = useSharedValue(0)

    const hide = useCallback(() => {
      setIsVisible(false)
      bottomSheetModalRef.current?.close()
    }, [])

    const show = useCallback(
      ({
        type,
        url,
        warning,
        additionalMessage,
        serializedTxs,
        header,
        suppressWarnings,
      }: WalletSignOpts) => {
        bottomSheetModalRef.current?.expand()
        setIsVisible(true)
        setWalletSignOpts({
          type,
          url,
          warning,
          additionalMessage,
          serializedTxs,
          header,
          suppressWarnings,
        })
        const p = new Promise<boolean>((resolve) => {
          promiseResolve = resolve
        })
        return p
      },
      [],
    )

    const renderBackdrop = useCallback(
      (props) => (
        <BottomSheetBackdrop
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...props}
        />
      ),
      [],
    )

    const handleModalDismiss = useCallback(() => {
      if (promiseResolve) {
        promiseResolve(false)
      }
      // We need to re present the bottom sheet after it is dismissed so that it can be expanded again
      bottomSheetModalRef.current?.present()
      setIsVisible(false)
      if (onClose) {
        onClose()
      }
    }, [onClose])

    const handleIndicatorStyle = useMemo(() => {
      return {
        backgroundColor: secondaryText,
      }
    }, [secondaryText])

    const onAcceptHandler = useCallback(() => {
      if (promiseResolve) {
        hide()
        promiseResolve(true)
      }
    }, [hide])

    const onCancelHandler = useCallback(() => {
      if (promiseResolve) {
        hide()
        promiseResolve(false)
      }
    }, [hide])

    useEffect(() => {
      bottomSheetModalRef.current?.present()
    }, [bottomSheetModalRef])

    const showWarnings =
      totalWarnings &&
      !walletSignOpts.suppressWarnings &&
      worstSeverity === 'critical'

    const { type, warning, additionalMessage } = walletSignOpts
    return (
      <Box flex={1}>
        <BottomSheetModalProvider>
          <BottomSheetModal
            ref={bottomSheetModalRef}
            index={-1}
            backgroundStyle={backgroundStyle}
            backdropComponent={renderBackdrop}
            onDismiss={handleModalDismiss}
            enableDismissOnClose
            handleIndicatorStyle={handleIndicatorStyle}
            // https://ethercreative.github.io/react-native-shadow-generator/
            style={{
              shadowColor: '#000',
              shadowOffset: {
                width: 0,
                height: 12,
              },
              shadowOpacity: 0.58,
              shadowRadius: 16.0,
              elevation: 24,
            }}
            enableDynamicSizing
            contentHeight={animatedContentHeight}
          >
            <BottomSheetScrollView>
              <Box p="m">
                {walletSignOpts.header || walletSignOpts.url ? (
                  <Box marginBottom="l">
                    {walletSignOpts.header ? (
                      <Text variant="h4Medium" color="white" textAlign="center">
                        {walletSignOpts.header}
                      </Text>
                    ) : null}
                    {walletSignOpts.url ? (
                      <Text
                        variant="body1Medium"
                        color="secondaryText"
                        textAlign="center"
                      >
                        {walletSignOpts.url || ''}
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
                          <TouchableOpacity
                            onPress={() => setInfoVisible((prev) => !prev)}
                          >
                            <InfoIcon width={15} height={15} />
                          </TouchableOpacity>
                        </Box>
                        {infoVisible && (
                          <Text mt="s" variant="body3" color="white">
                            {t('browserScreen.estimatedChangesDescription')}
                          </Text>
                        )}

                        {!(insufficientFunds || insufficientRentExempt) &&
                          additionalMessage && (
                            <Text
                              mt="s"
                              mb="s"
                              variant="body1Medium"
                              color="secondaryText"
                            >
                              {additionalMessage}
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
                          <Box
                            flexGrow={1}
                            flexDirection="row"
                            alignItems="center"
                          >
                            <Text variant="subtitle3" mr="s">
                              {t('browserScreen.writableAccounts')}
                            </Text>
                            <TouchableOpacity
                              onPress={() =>
                                setWritableInfoVisible((prev) => !prev)
                              }
                            >
                              <InfoIcon width={15} height={15} />
                            </TouchableOpacity>
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
                          {isVisible && currentTxs && (
                            <>
                              {currentTxs.map((tx, idx) => (
                                <WalletSignBottomSheetTransaction
                                  // eslint-disable-next-line react/no-array-index-key
                                  key={`transaction-${idx}`}
                                  transaction={tx}
                                  transactionIdx={idx}
                                  totalTransactions={
                                    walletSignOpts?.serializedTxs?.length || 0
                                  }
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
                      {(type ===
                        WalletStandardMessageTypes.signAndSendTransaction ||
                        type ===
                          WalletStandardMessageTypes.signTransaction) && (
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
            </BottomSheetScrollView>
          </BottomSheetModal>
          {children}
        </BottomSheetModalProvider>
      </Box>
    )
  },
)

export default memo(WalletSignBottomSheet)
