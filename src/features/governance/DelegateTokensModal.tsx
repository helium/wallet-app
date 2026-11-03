import {
  SubDaoWithMeta,
  useDataBurnSplit,
  useSubDaoDelegationSplit,
  useSubDaos,
} from '@helium/voter-stake-registry-hooks'
import { useGovernance } from '@storage/GovernanceProvider'
import { Button } from '@ui/Button'
import { PressableScale } from '@ui/PressableScale'
import { Spinner } from '@ui/Spinner'
import { Text } from '@ui/Text'
import { TokenIcon } from '@ui/TokenIcon'
import { twMerge } from '@ui/twMerge'
import { humanReadable } from '@utils/solanaUtils'
import BN from 'bn.js'
import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, View } from 'react-native'
import { SplitBar } from './SplitBar'
import { AutomationFeesWidget } from './components/AutomationFeesWidget'
import { GovernanceModal } from './components/GovernanceModal'

export const DelegateTokensModal = ({
  onClose,
  onSubmit,
  onSetAutomationEnabled,
  automationEnabled,
  estimatedSolFee,
  insufficientBalance,
  subDao: selectedSubDao,
  setSubDao,
}: {
  onClose: () => void
  onSubmit: () => Promise<void>
  onSetAutomationEnabled: (enabled: boolean) => void
  automationEnabled: boolean
  estimatedSolFee?: string
  insufficientBalance: boolean
  subDao: SubDaoWithMeta | null
  setSubDao: (subDao: SubDaoWithMeta | null) => void
}) => {
  const { t } = useTranslation()
  const { loading, error, result: subDaos } = useSubDaos()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [transactionError, setTransactionError] = useState()
  const { voteService } = useGovernance()
  const { data: revData } = useDataBurnSplit({
    voteService,
  })
  const {
    iot: iotDataUsageRev,
    mobile: mobileDataUsageRev,
    loading: revLoading,
  } = revData || {}
  const { data: delegationData, isLoading: delegationLoading } =
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

  const handleOnClose = () => {
    onClose()
  }

  const handleSubmit = async () => {
    if (selectedSubDao) {
      try {
        setIsSubmitting(true)
        await onSubmit()

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        setIsSubmitting(false)
        setTransactionError(e.message || t('gov.errors.delegatePositions'))
      }
    }
    onClose()
  }

  const showError = useMemo(() => {
    if (transactionError) return transactionError
  }, [transactionError])

  return (
    <GovernanceModal onClose={handleOnClose}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" className="h-full">
        <View className="grow justify-center">
          {!loading && (
            <>
              <Text size="xl" className="font-semibold" adjustsFontSizeToFit>
                {t('gov.transactions.delegatePosition')}
              </Text>
              <Text className="mb-2 text-muted-foreground">
                {t('gov.positions.selectSubDao')}
              </Text>
              <View className="rounded-[12px] bg-card p-3">
                <Text size="xs">{t('gov.positions.delegateBlurb')}</Text>
              </View>

              {!revLoading &&
                !delegationLoading &&
                !!mobileDataUsageRev &&
                !!iotDataUsageRev &&
                mobileDelegationPercentage != null &&
                iotDelegationPercentage != null && (
                  <View className="my-6">
                    <SplitBar
                      title={t('gov.automation.networkRevenue')}
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
                      leftColor="mobile"
                      rightColor="iot"
                      leftLabel="Mobile"
                      rightLabel="IoT"
                    />
                    <View className="mt-2">
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
                        leftColor="mobile"
                        rightColor="iot"
                        leftLabel="Mobile"
                        rightLabel="IOT"
                      />
                    </View>
                  </View>
                )}
            </>
          )}
          {loading && (
            <View className="items-center justify-center">
              <Spinner size="small" />
              <Text className="mt-3 text-muted-foreground">
                {t('gov.positions.fetchingSubDaos')}
              </Text>
            </View>
          )}
          <View>
            {subDaos
              ?.sort((a, b) =>
                b.dntMetadata.name.localeCompare(a.dntMetadata.name),
              )
              .map((subDao, idx) => {
                const isSelected = selectedSubDao?.pubkey.equals(subDao.pubkey)

                return (
                  <PressableScale
                    key={subDao.pubkey.toString()}
                    testID="DelegateTokens.SubDao"
                    feedback="opacity"
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                    className={twMerge(
                      'rounded-[12px] border-2 border-transparent bg-secondary',
                      idx > 0 && 'mt-4',
                      isSelected && 'border-foreground bg-card',
                    )}
                    onPress={() => setSubDao(subDao)}
                  >
                    <View className="flex-row items-center p-3">
                      <View className="rounded-full border-2 border-background">
                        <TokenIcon
                          size={26}
                          img={subDao.dntMetadata.json?.image || ''}
                        />
                      </View>
                      <Text size="base" className="ml-4 font-medium">
                        {subDao.dntMetadata.name.replace('Helium', '')}
                      </Text>
                    </View>
                  </PressableScale>
                )
              })}
          </View>
        </View>
        {showError && (
          <View className="flex-row items-center justify-center pt-3">
            <Text size="xs" className="font-medium text-destructive">
              {showError}
            </Text>
          </View>
        )}
        <AutomationFeesWidget
          automationEnabled={automationEnabled}
          onSetAutomationEnabled={onSetAutomationEnabled}
          estimatedSolFee={estimatedSolFee}
        />
        <View className="flex-row pt-4">
          <Button
            variant="cta"
            size="dashboard"
            className="flex-1"
            onPress={() => void handleSubmit().catch(console.error)}
            testID="DelegateTokens.Submit"
            disabled={!selectedSubDao || isSubmitting || insufficientBalance}
          >
            {isSubmitting ? (
              <Spinner colorClassName="accent-white" />
            ) : insufficientBalance ? (
              'Insufficient SOL Balance'
            ) : (
              'Delegate Tokens'
            )}
          </Button>
        </View>
      </ScrollView>
    </GovernanceModal>
  )
}
