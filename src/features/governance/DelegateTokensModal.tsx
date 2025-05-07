import { ReAnimatedBlurBox } from '@components/AnimatedBox'
import BackScreen from '@components/BackScreen'
import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import CircleLoader from '@components/CircleLoader'
import { FadeInFast } from '@components/FadeInOut'
import Text from '@components/Text'
import TokenIcon from '@components/TokenIcon'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { Portal } from '@gorhom/portal'
import {
  SubDaoWithMeta,
  useDataBurnSplit,
  useSubDaoDelegationSplit,
  useSubDaos,
} from '@helium/voter-stake-registry-hooks'
import { useGovernance } from '@storage/GovernanceProvider'
import { useColors } from '@theme/themeHooks'
import { MOBILE_SUB_DAO_KEY } from '@utils/constants'
import { humanReadable } from '@utils/solanaUtils'
import BN from 'bn.js'
import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Platform, ScrollView, Switch } from 'react-native'
import { Edge } from 'react-native-safe-area-context'
import { SplitBar } from './SplitBar'

export const DelegateTokensModal = ({
  onClose,
  onSubmit,
  onSetAutomationEnabled,
  automationEnabled,
  solFees,
  prepaidTxFees,
  insufficientBalance,
  subDao: selectedSubDao,
  setSubDao,
}: {
  onClose: () => void
  onSubmit: () => Promise<void>
  onSetAutomationEnabled: (enabled: boolean) => void
  automationEnabled: boolean
  solFees: number
  prepaidTxFees: number
  insufficientBalance: boolean
  subDao: SubDaoWithMeta | null
  setSubDao: (subDao: SubDaoWithMeta | null) => void
}) => {
  const { t } = useTranslation()
  const { loading, error, result: subDaos } = useSubDaos()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [transactionError, setTransactionError] = useState()
  const backEdges = useMemo(() => ['top'] as Edge[], [])
  const { voteService } = useGovernance()
  const { primaryText, primaryBackground } = useColors()
  const { data: revData } = useDataBurnSplit({
    voteService,
  })
  const {
    iot: iotDataUsageRev,
    mobile: mobileDataUsageRev,
    loading: revLoading,
  } = revData || {}
  const { data: delegationData, loading: delegationLoading } =
    useSubDaoDelegationSplit({
      voteService,
    })
  const { iot: iotDelegation, mobile: mobileDelegation } = delegationData || {}

  const totalDataUsage = useMemo(() => {
    return Number(mobileDataUsageRev) + Number(iotDataUsageRev)
  }, [mobileDataUsageRev, iotDataUsageRev])
  const totalVetokens = useMemo(() => {
    if (mobileDelegation && iotDelegation) {
      return new BN(mobileDelegation).add(new BN(iotDelegation))
    }
  }, [mobileDelegation, iotDelegation])

  const mobileDelegationPercentage = useMemo(() => {
    if (mobileDelegation && totalVetokens) {
      return (
        new BN(mobileDelegation)
          .mul(new BN(10000))
          .div(totalVetokens)
          .toNumber() / 100
      )
    }
  }, [mobileDelegation, totalVetokens])

  const iotDelegationPercentage = useMemo(() => {
    if (iotDelegation && totalVetokens) {
      return (
        new BN(iotDelegation).mul(new BN(10000)).div(totalVetokens).toNumber() /
        100
      )
    }
  }, [iotDelegation, totalVetokens])

  const mobileDataUsagePercentage = useMemo(() => {
    return (Number(mobileDataUsageRev) / totalDataUsage) * 100
  }, [mobileDataUsageRev, totalDataUsage])

  const iotDataUsagePercentage = useMemo(() => {
    return (Number(iotDataUsageRev) / totalDataUsage) * 100
  }, [iotDataUsageRev, totalDataUsage])

  useEffect(() => {
    if (error) {
      console.error(error.message)
    }
  }, [error])

  useEffect(() => {
    if (subDaos && !selectedSubDao) {
      setSubDao(
        subDaos.find((subDao) => subDao.pubkey.equals(MOBILE_SUB_DAO_KEY)) ||
          null,
      )
    }
  }, [subDaos, selectedSubDao, setSubDao])

  const handleOnClose = () => {
    onClose()
  }

  const handleSubmit = async () => {
    if (selectedSubDao) {
      try {
        setIsSubmitting(true)
        await onSubmit()

        onClose()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        setIsSubmitting(false)
        setTransactionError(e.message || t('gov.errors.delegatePositions'))
      }
    }
  }

  const showError = useMemo(() => {
    if (transactionError) return transactionError
  }, [transactionError])

  return (
    <Portal hostName="GovernancePortalHost">
      {/* This is because Android sucks and does not support expo blur and the experimental feature is trash :) */}
      {Platform.OS === 'android' && (
        <Box
          position="absolute"
          zIndex={0}
          left={0}
          top={0}
          height="100%"
          width="100%"
          backgroundColor="black"
        />
      )}
      <ReAnimatedBlurBox
        entering={FadeInFast}
        position="absolute"
        height="100%"
        width="100%"
        tint="dark"
        intensity={80}
      >
        <BackScreen
          hideBack
          edges={backEdges}
          onClose={handleOnClose}
          backgroundColor="transparent"
          flex={1}
          padding="m"
          marginHorizontal="s"
        >
          <ScrollView style={{ height: '100%' }}>
            <Box flexGrow={1} justifyContent="center">
              {!loading && (
                <>
                  <Text
                    textAlign="left"
                    variant="subtitle2"
                    adjustsFontSizeToFit
                  >
                    {t('gov.transactions.delegatePosition')}
                  </Text>
                  <Text
                    variant="subtitle4"
                    color="secondaryText"
                    marginBottom="s"
                  >
                    {t('gov.positions.selectSubDao')}
                  </Text>
                  <Box borderRadius="l" backgroundColor="black900" padding="ms">
                    <Text variant="body3">
                      {t('gov.positions.delegateBlurb')}
                    </Text>
                  </Box>

                  {!revLoading &&
                    !delegationLoading &&
                    mobileDataUsageRev &&
                    iotDataUsageRev &&
                    mobileDelegationPercentage &&
                    iotDelegationPercentage && (
                      <Box marginTop="l" marginBottom="l">
                        <SplitBar
                          title={t('gov.automation.dataUsageRevenue')}
                          leftValue={`$${humanReadable(
                            new BN(mobileDataUsageRev.toFixed(0)),
                            0,
                          )}`}
                          rightValue={`$${humanReadable(
                            new BN(iotDataUsageRev.toFixed(0)),
                            0,
                          )}`}
                          leftPercentage={mobileDataUsagePercentage}
                          rightPercentage={iotDataUsagePercentage}
                          leftColor="mobileBlue"
                          rightColor="iotGreen"
                          leftLabel="Mobile"
                          rightLabel="IOT"
                        />
                        <Box marginTop="s">
                          <SplitBar
                            title={t('gov.automation.delegationSplit')}
                            leftValue={`${
                              mobileDelegationPercentage?.toFixed(1) || '0.0'
                            }%`}
                            rightValue={`${
                              iotDelegationPercentage?.toFixed(1) || '0.0'
                            }%`}
                            leftPercentage={mobileDelegationPercentage || 0}
                            rightPercentage={iotDelegationPercentage || 0}
                            leftColor="mobileBlue"
                            rightColor="iotGreen"
                            leftLabel="Mobile"
                            rightLabel="IOT"
                          />
                        </Box>
                      </Box>
                    )}
                </>
              )}
              {loading && (
                <Box justifyContent="center" alignItems="center">
                  <CircleLoader loaderSize={20} />
                  <Text
                    variant="subtitle4"
                    color="secondaryText"
                    marginTop="ms"
                  >
                    {t('gov.positions.fetchingSubDaos')}
                  </Text>
                </Box>
              )}
              <Box>
                {subDaos
                  ?.sort((a, b) =>
                    b.dntMetadata.name.localeCompare(a.dntMetadata.name),
                  )
                  .map((subDao, idx) => {
                    const isSelected = selectedSubDao?.pubkey.equals(
                      subDao.pubkey,
                    )

                    return (
                      <TouchableOpacityBox
                        key={subDao.pubkey.toString()}
                        borderRadius="l"
                        marginTop={idx > 0 ? 'm' : 'none'}
                        backgroundColor={
                          isSelected ? 'secondaryBackground' : 'secondary'
                        }
                        borderWidth={isSelected ? 2 : 0}
                        borderColor="white"
                        onPress={() => setSubDao(subDao)}
                      >
                        <Box
                          flexDirection="row"
                          padding="ms"
                          alignItems="center"
                        >
                          <Box
                            borderColor="black"
                            borderWidth={2}
                            borderRadius="round"
                          >
                            <TokenIcon
                              size={26}
                              img={subDao.dntMetadata.json?.image || ''}
                            />
                          </Box>
                          <Text
                            variant="subtitle3"
                            color="primaryText"
                            marginLeft="m"
                          >
                            {subDao.dntMetadata.name.replace('Helium', '')}
                          </Text>
                        </Box>
                      </TouchableOpacityBox>
                    )
                  })}
              </Box>
            </Box>
            {showError && (
              <Box
                flexDirection="row"
                justifyContent="center"
                alignItems="center"
                paddingTop="ms"
              >
                <Text variant="body3Medium" color="red500">
                  {showError}
                </Text>
              </Box>
            )}
            <Box
              backgroundColor="surfaceSecondary"
              borderRadius="l"
              padding="m"
              marginTop="m"
              marginBottom="m"
            >
              <Box
                flexDirection="row"
                justifyContent="space-between"
                alignItems="center"
                marginBottom="s"
              >
                <Box flex={1}>
                  <Text variant="body2" color="grey400">
                    {t('gov.automation.enableAutomation')}
                  </Text>
                </Box>
                <Switch
                  value={automationEnabled}
                  onValueChange={onSetAutomationEnabled}
                  thumbColor={
                    Platform.OS === 'android' ? primaryText : primaryBackground
                  }
                  style={
                    Platform.OS === 'android'
                      ? undefined
                      : {
                          transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
                          marginRight: -8,
                        }
                  }
                />
              </Box>
              <Box
                flexDirection="row"
                justifyContent="space-between"
                marginBottom="s"
              >
                <Text variant="body2" color="grey400">
                  {t('gov.automation.rentFees')}
                </Text>
                <Text variant="body2Medium" color="grey200">
                  {solFees.toFixed(6)} SOL
                </Text>
              </Box>
              <Box
                flexDirection="row"
                justifyContent="space-between"
                marginBottom="s"
              >
                <Text variant="body2" color="grey400">
                  {t('gov.automation.prepaidTxFees')}
                </Text>
                <Text variant="body2Medium" color="grey200">
                  {prepaidTxFees.toFixed(6)} SOL
                </Text>
              </Box>
            </Box>
            <Box flexDirection="row" paddingTop="m">
              <ButtonPressable
                flex={1}
                fontSize={16}
                borderRadius="round"
                backgroundColor="white"
                backgroundColorOpacityPressed={0.7}
                backgroundColorDisabled="surfaceSecondary"
                backgroundColorDisabledOpacity={0.9}
                titleColorDisabled="secondaryText"
                title={
                  isSubmitting
                    ? ''
                    : insufficientBalance
                    ? 'Insufficient SOL Balance'
                    : 'Delegate Tokens'
                }
                titleColor="black"
                onPress={handleSubmit}
                disabled={
                  !selectedSubDao || isSubmitting || insufficientBalance
                }
                TrailingComponent={
                  isSubmitting ? <CircleLoader color="white" /> : undefined
                }
              />
            </Box>
          </ScrollView>
        </BackScreen>
      </ReAnimatedBlurBox>
    </Portal>
  )
}
