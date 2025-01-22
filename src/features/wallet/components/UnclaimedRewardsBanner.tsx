import Box from '@components/Box'
import Text from '@components/Text'
import TouchableContainer from '@components/TouchableContainer'
import React, { useCallback, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import HntIcon from '@assets/svgs/hntIconNew.svg'
import IotIcon from '@assets/svgs/iotIconNew.svg'
import MobileIcon from '@assets/svgs/mobileIconNew.svg'
import BalanceText from '@components/BalanceText'
import { toNumber } from '@helium/spl-utils'
import useHotspots from '@hooks/useHotspots'
import { useNavigation } from '@react-navigation/native'
import { ServiceSheetNavigationProp } from '@services/serviceSheetTypes'

const UnclaimedRewardsBanner = () => {
  const { t } = useTranslation()
  const navigation = useNavigation<ServiceSheetNavigationProp>()
  const {
    pendingIotRewards,
    pendingHntRewards,
    pendingMobileRewards,
    refresh,
  } = useHotspots()

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const totalPendingIot = useMemo(() => {
    if (!pendingIotRewards) return 0
    return toNumber(pendingIotRewards, 6)
  }, [pendingIotRewards])

  const totalPendingHnt = useMemo(() => {
    if (!pendingHntRewards) return 0
    return toNumber(pendingHntRewards, 8)
  }, [pendingHntRewards])

  const totalPendingMobile = useMemo(() => {
    if (!pendingMobileRewards) return 0
    return toNumber(pendingMobileRewards, 6)
  }, [pendingMobileRewards])

  const goToClaimRewards = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(navigation as any).navigate('HotspotService', {
      screen: 'ClaimTokens',
    })
  }, [navigation])

  if (
    totalPendingHnt === 0 &&
    totalPendingIot === 0 &&
    totalPendingMobile === 0
  )
    return null

  return (
    <TouchableContainer
      padding="xl"
      borderRadius="2xl"
      flexDirection="column"
      gap="2"
      onPress={goToClaimRewards}
    >
      <Text variant="textSmSemibold">{t('UnclaimedRewardsBanner.title')}</Text>
      <Box flexDirection="row" gap="2" flex={1} flexWrap="wrap">
        {totalPendingHnt > 0 && (
          <RewardPill amount={totalPendingHnt} ticker="HNT" />
        )}
        {totalPendingMobile > 0 && (
          <RewardPill amount={totalPendingMobile} ticker="MOBILE" />
        )}
        {totalPendingIot > 0 && (
          <RewardPill amount={totalPendingIot} ticker="IOT" />
        )}
      </Box>
    </TouchableContainer>
  )
}

const RewardPill = ({
  amount,
  ticker,
}: {
  amount: number
  ticker: 'HNT' | 'IOT' | 'MOBILE'
}) => {
  const pillBackgroundColor = useMemo(() => {
    if (ticker === 'HNT') return 'purple.100'
    if (ticker === 'IOT') return 'bg.success-primary'
    if (ticker === 'MOBILE') return 'bg.brand-secondary'
  }, [ticker])

  const tickerColor = useMemo(() => {
    if (ticker === 'HNT') return 'purple.600'
    if (ticker === 'IOT') return 'green.600'
    if (ticker === 'MOBILE') return 'blue.600'
  }, [ticker])

  const TokenIcon = useCallback(() => {
    if (ticker === 'HNT') return <HntIcon width={28} height={28} />
    if (ticker === 'IOT') return <IotIcon width={28} height={28} />
    if (ticker === 'MOBILE') return <MobileIcon width={28} height={28} />
  }, [ticker])

  return (
    <Box
      borderRadius="full"
      padding="xs"
      paddingHorizontal="md"
      backgroundColor={pillBackgroundColor}
      flexDirection="row"
      gap="2"
    >
      <TokenIcon />
      <Box flexDirection="row" alignItems="center" gap="0.5">
        <BalanceText variant="textSmMedium" amount={amount} />
        <Text variant="textSmMedium" color={tickerColor}>
          {ticker}
        </Text>
      </Box>
    </Box>
  )
}

export default UnclaimedRewardsBanner
