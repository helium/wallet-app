import Box from '@components/Box'
import {
  useDataBurnSplit,
  useSubDaoDelegationSplit,
} from '@helium/voter-stake-registry-hooks'
import { useGovernance } from '@storage/GovernanceProvider'
import { humanReadable } from '@utils/solanaUtils'
import BN from 'bn.js'
import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
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
    <Box marginTop="l" marginBottom="l">
      <SplitBar
        title={t('gov.automation.networkRevenue')}
        leftValue={`$${humanReadable(
          new BN(mobileDataUsageRev.toFixed(0)),
          0,
        )}`}
        rightValue={`$${humanReadable(new BN(iotDataUsageRev.toFixed(0)), 0)}`}
        leftPercentage={mobileDataUsagePercentage}
        rightPercentage={iotDataUsagePercentage}
        leftColor="mobileBlue"
        rightColor="iotGreen"
        leftLabel="Mobile"
        rightLabel="IoT"
      />
      <Box marginTop="s">
        <SplitBar
          title={t('gov.automation.delegationSplit')}
          leftValue={`${mobileDelegationPercentage?.toFixed(1) || '0.0'}%`}
          rightValue={`${iotDelegationPercentage?.toFixed(1) || '0.0'}%`}
          leftPercentage={mobileDelegationPercentage || 0}
          rightPercentage={iotDelegationPercentage || 0}
          leftColor="mobileBlue"
          rightColor="iotGreen"
          leftLabel="Mobile"
          rightLabel="IOT"
        />
      </Box>
    </Box>
  )
}
