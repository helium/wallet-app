import {
  useDataBurnSplit,
  useSubDaoDelegationSplit,
} from '@helium/voter-stake-registry-hooks'
import { useGovernance } from '@storage/GovernanceProvider'
import { humanReadable } from '@utils/solanaUtils'
import BN from 'bn.js'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { SplitBar } from '../SplitBar'

export const DataSplitBars = () => {
  const { t } = useTranslation()
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

  const totalDataUsage = Number(mobileDataUsageRev) + Number(iotDataUsageRev)
  const totalVetokens =
    mobileDelegation && iotDelegation
      ? new BN(mobileDelegation).add(new BN(iotDelegation))
      : undefined

  const mobileDelegationPercentage =
    mobileDelegation && totalVetokens
      ? new BN(mobileDelegation)
          .mul(new BN(10000))
          .div(totalVetokens)
          .toNumber() / 100
      : undefined

  const iotDelegationPercentage =
    iotDelegation && totalVetokens
      ? new BN(iotDelegation).mul(new BN(10000)).div(totalVetokens).toNumber() /
        100
      : undefined

  const mobileDataUsagePercentage =
    (Number(mobileDataUsageRev) / totalDataUsage) * 100

  const iotDataUsagePercentage =
    (Number(iotDataUsageRev) / totalDataUsage) * 100

  if (revLoading || delegationLoading) return null

  if (
    !mobileDataUsageRev ||
    !iotDataUsageRev ||
    !mobileDelegationPercentage ||
    !iotDelegationPercentage
  ) {
    return null
  }

  return (
    <View className="my-6">
      <SplitBar
        title={t('gov.automation.networkRevenue')}
        leftValue={`$${humanReadable(
          new BN(mobileDataUsageRev.toFixed(0)),
          0,
        )}`}
        rightValue={`$${humanReadable(new BN(iotDataUsageRev.toFixed(0)), 0)}`}
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
          leftValue={`${mobileDelegationPercentage?.toFixed(1) || '0.0'}%`}
          rightValue={`${iotDelegationPercentage?.toFixed(1) || '0.0'}%`}
          leftPercentage={mobileDelegationPercentage || 0}
          rightPercentage={iotDelegationPercentage || 0}
          leftColor="mobile"
          rightColor="iot"
          leftLabel="Mobile"
          rightLabel="IOT"
        />
      </View>
    </View>
  )
}
