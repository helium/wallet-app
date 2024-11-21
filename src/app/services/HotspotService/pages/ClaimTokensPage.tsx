import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import ScrollBox from '@components/ScrollBox'
import Text from '@components/Text'
import { useColors, useSpacing } from '@config/theme/themeHooks'
import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, RefreshControl } from 'react-native'
import MobileIcon from '@assets/svgs/mobileIconNew.svg'
import IotIcon from '@assets/svgs/iotIconNew.svg'
import TouchableContainer from '@components/TouchableContainer'
import BalanceText from '@components/BalanceText'
import useHotspots from '@hooks/useHotspots'
import { toNumber } from '@helium/spl-utils'
import {
  MOBILE_LAZY_KEY,
  IOT_LAZY_KEY,
  MIN_BALANCE_THRESHOLD,
} from '@utils/constants'
import useSubmitTxn from '@hooks/useSubmitTxn'
import { useBN } from '@hooks/useBN'
import { useSolOwnedAmount } from '@helium/helium-react-hooks'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import { BN } from 'bn.js'
import { useModal } from '@config/storage/ModalsProvider'
import ProgressBar from '@components/ProgressBar'
import { ReAnimatedBox } from '@components/AnimatedBox'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { RootState } from '@store/rootReducer'
import { useSelector } from 'react-redux'

const ClaimTokensPage = () => {
  const { t } = useTranslation()
  const spacing = useSpacing()
  const { submitClaimAllRewards } = useSubmitTxn()
  const wallet = useCurrentWallet()
  const { showModal } = useModal()
  const solBalance = useBN(useSolOwnedAmount(wallet).amount)
  const colors = useColors()

  const hasEnoughSol = useMemo(() => {
    return (solBalance || new BN(0)).gt(new BN(MIN_BALANCE_THRESHOLD))
  }, [solBalance])

  const {
    pendingIotRewards,
    pendingMobileRewards,
    hotspotsWithMeta,
    totalHotspots,
    loading: hotspotsLoading,
    fetchAll,
  } = useHotspots()

  const contentContainerStyle = useMemo(() => {
    return {
      padding: spacing['2xl'],
    }
  }, [spacing])

  const totalPendingIot = useMemo(() => {
    if (!pendingIotRewards) return 0
    return toNumber(pendingIotRewards, 6)
  }, [pendingIotRewards])

  const totalPendingMobile = useMemo(() => {
    if (!pendingMobileRewards) return 0
    return toNumber(pendingMobileRewards, 6)
  }, [pendingMobileRewards])

  const solanaPayment = useSelector(
    (reduxState: RootState) => reduxState.solana.payment,
  )

  const claiming = useMemo(() => {
    return solanaPayment?.loading
  }, [solanaPayment])

  const claimError = useMemo(() => {
    return solanaPayment?.error
  }, [solanaPayment])

  const claimingDisabled = useMemo(() => {
    return (
      claiming ||
      !hasEnoughSol ||
      (totalPendingIot === 0 && totalPendingMobile === 0)
    )
  }, [claiming, hasEnoughSol, totalPendingIot, totalPendingMobile])

  const onClaim = useCallback(async () => {
    try {
      const claim = async () => {
        await submitClaimAllRewards(
          [IOT_LAZY_KEY, MOBILE_LAZY_KEY],
          hotspotsWithMeta,
          totalHotspots,
        )
      }

      if (!hasEnoughSol) {
        showModal({
          type: 'InsufficientSolConversion',
          onCancel: async () => {},
          onSuccess: claim,
        })
      } else {
        await claim()
      }
    } catch {}
  }, [
    hasEnoughSol,
    submitClaimAllRewards,
    hotspotsWithMeta,
    totalHotspots,
    showModal,
  ])

  return (
    <ScrollBox
      contentContainerStyle={contentContainerStyle}
      refreshControl={
        <RefreshControl
          enabled
          refreshing={hotspotsLoading}
          onRefresh={fetchAll}
          title=""
          tintColor={colors.primaryText}
        />
      }
    >
      <Box justifyContent="center" alignItems="center" marginTop="6xl">
        <Image source={require('@assets/images/claimTokensIcon.png')} />
      </Box>
      <Text
        variant="displayMdMedium"
        textAlign="center"
        color="primaryText"
        marginTop="2.5"
      >
        {t('ClaimTokensPage.title')}
      </Text>
      <Text
        variant="textSmMedium"
        textAlign="center"
        color="secondaryText"
        marginTop="2.5"
      >
        {t('ClaimTokensPage.subtitle')}
      </Text>
      <Box
        flexDirection="row"
        borderRadius="4xl"
        overflow="hidden"
        gap="1"
        marginTop="4xl"
      >
        <TouchableContainer
          padding="xl"
          gap="2.5"
          backgroundColor="bg.brand-secondary"
          backgroundColorPressed="blue.light-200"
          pressableStyles={{
            flex: 1,
          }}
        >
          <Box flexDirection="row" gap="2.5" alignItems="center">
            <MobileIcon />
            <Box flexDirection="column">
              <BalanceText amount={totalPendingMobile} />
              <Text variant="textXsMedium" color="blue.dark-500">
                MOBILE
              </Text>
            </Box>
          </Box>
        </TouchableContainer>
        <TouchableContainer
          padding="xl"
          gap="2.5"
          backgroundColor="bg.success-primary"
          backgroundColorPressed="success.100"
          pressableStyles={{
            flex: 1,
          }}
        >
          <Box flexDirection="row" gap="2.5" alignItems="center">
            <IotIcon />
            <Box flexDirection="column">
              <BalanceText amount={totalPendingIot} />
              <Text variant="textXsMedium" color="success.500">
                IOT
              </Text>
            </Box>
          </Box>
        </TouchableContainer>
      </Box>
      <ButtonPressable
        marginTop="2xl"
        backgroundColor="primaryText"
        titleColor="primaryBackground"
        title={t('ClaimTokensPage.claimTokens')}
        onPress={onClaim}
        marginBottom="3xl"
        loading={claiming}
        customLoadingColorDisabled="primaryBackground"
        backgroundColorDisabled="fg.disabled"
        disabled={claimingDisabled}
      />
      {claiming && (
        <ReAnimatedBox entering={FadeIn} exiting={FadeOut}>
          <ProgressBar
            progress={solanaPayment?.progress?.percent || 0}
            flex={1}
            withLabel
          />
        </ReAnimatedBox>
      )}
      {claimError && (
        <Text variant="textSmMedium" color="error.500" textAlign="center">
          {claimError?.message}
        </Text>
      )}
    </ScrollBox>
  )
}

export default ClaimTokensPage
