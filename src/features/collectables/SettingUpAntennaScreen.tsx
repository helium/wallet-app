import React, { memo, useCallback } from 'react'
import Box from '@components/Box'
import { useAccountStorage } from '@storage/AccountStorageProvider'
import { useNavigation } from '@react-navigation/native'
import { TabBarNavigationProp } from 'src/navigation/rootTypes'
import { ReAnimatedBox } from '@components/AnimatedBox'
import { DelayedFadeIn } from '@components/FadeInOut'
import BackArrow from '@assets/images/backArrow.svg'
import AccountIcon from '@components/AccountIcon'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import Text from '@components/Text'
import ButtonPressable from '@components/ButtonPressable'
import IndeterminateProgressBar from '@components/IndeterminateProgressBar'
import { parseTransactionError } from '@utils/solanaUtils'
import { useBN } from '@hooks/useBN'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import { useSolOwnedAmount } from '@helium/helium-react-hooks'
import { RootState } from '../../store/rootReducer'

const SettingUpAntennaScreen = () => {
  const { currentAccount } = useAccountStorage()
  const navigation = useNavigation<TabBarNavigationProp>()
  const wallet = useCurrentWallet()
  const solBalance = useBN(useSolOwnedAmount(wallet).amount)
  const { bottom } = useSafeAreaInsets()

  const { t } = useTranslation()
  const solanaPayment = useSelector(
    (reduxState: RootState) => reduxState.solana.payment,
  )

  const onReturn = useCallback(() => {
    // Reset Collectables stack to first screen
    navigation.reset({
      index: 0,
      routes: [{ name: 'Collectables' }],
    })
  }, [navigation])

  if (!currentAccount) {
    return null
  }

  return (
    <ReAnimatedBox
      entering={DelayedFadeIn}
      flex={1}
      backgroundColor="secondaryBackground"
    >
      <Box
        backgroundColor="transparent"
        flex={1}
        padding="m"
        alignItems="center"
        justifyContent="center"
      >
        <Box flexGrow={1} justifyContent="center" alignItems="center">
          <Box
            shadowColor="black"
            shadowOpacity={0.4}
            shadowOffset={{ width: 0, height: 10 }}
            shadowRadius={10}
            elevation={12}
          >
            <AccountIcon address={currentAccount?.solanaAddress} size={76} />
          </Box>
          {(!solanaPayment ||
            (solanaPayment &&
              !solanaPayment.error &&
              !solanaPayment.loading)) && (
            <Animated.View
              style={{ alignItems: 'center' }}
              entering={FadeIn}
              exiting={FadeOut}
            >
              <Text variant="h1Medium" color="white" marginTop="xl">
                {t('antennaSetupScreen.settingUpComplete')}
              </Text>
              <Text
                variant="body2"
                color="secondaryText"
                marginTop="xl"
                numberOfLines={2}
                textAlign="center"
              >
                {t('antennaSetupScreen.settingUpCompleteBody')}
              </Text>
            </Animated.View>
          )}

          {solanaPayment?.error && (
            <Animated.View
              style={{
                alignItems: 'center',
              }}
              entering={FadeIn}
              exiting={FadeOut}
            >
              <Text
                variant="h1Medium"
                color="white"
                marginTop="xl"
                textAlign="center"
              >
                {t('collectablesScreen.rewardsError')}
              </Text>
              <Text
                variant="body2"
                color="secondaryText"
                marginTop="xl"
                numberOfLines={2}
                textAlign="center"
              >
                {parseTransactionError(
                  solBalance,
                  solanaPayment?.error?.message,
                )}
              </Text>
            </Animated.View>
          )}

          {solanaPayment && solanaPayment.loading && (
            <Animated.View
              style={{ alignItems: 'center' }}
              entering={FadeIn}
              exiting={FadeOut}
            >
              <Text
                variant="h1Medium"
                color="white"
                marginTop="xl"
                textAlign="center"
              >
                {t('antennaSetupScreen.settingUp')}
              </Text>
              <Text
                variant="body0"
                color="grey600"
                textAlign="center"
                marginBottom="m"
                marginTop="s"
              >
                {t('antennaSetupScreen.settingUpBody')}
              </Text>
              <Box flexDirection="row" marginHorizontal="xxl" marginTop="m">
                <IndeterminateProgressBar paddingHorizontal="l" />
              </Box>
            </Animated.View>
          )}
        </Box>
        <Box
          width="100%"
          justifyContent="flex-end"
          style={{ marginBottom: bottom }}
        >
          <ButtonPressable
            marginHorizontal="m"
            marginBottom="m"
            height={65}
            borderRadius="round"
            backgroundColor="white"
            backgroundColorOpacity={0.1}
            backgroundColorOpacityPressed={0.05}
            titleColorPressedOpacity={0.3}
            title={t('collectablesScreen.returnToCollectables')}
            titleColor="white"
            onPress={onReturn}
            disabled={solanaPayment && solanaPayment.loading}
            LeadingComponent={
              <BackArrow width={16} height={15} color="white" />
            }
          />
        </Box>
      </Box>
    </ReAnimatedBox>
  )
}

export default memo(SettingUpAntennaScreen)
