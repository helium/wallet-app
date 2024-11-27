import React, { memo, useCallback } from 'react'
import Box from '@components/Box'
import { useAccountStorage } from '@config/storage/AccountStorageProvider'
import { useNavigation } from '@react-navigation/native'
import { TabBarNavigationProp } from 'src/app/rootTypes'
import { ReAnimatedBox } from '@components/AnimatedBox'
import { DelayedFadeIn } from '@components/FadeInOut'
import BackArrow from '@assets/svgs/backArrow.svg'
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
        padding="4"
        alignItems="center"
        justifyContent="center"
      >
        <Box flexGrow={1} justifyContent="center" alignItems="center">
          <Box
            shadowColor="base.black"
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
              <Text variant="displayMdMedium" color="primaryText" marginTop="8">
                {t('antennaSetupScreen.settingUpComplete')}
              </Text>
              <Text
                variant="textSmRegular"
                color="secondaryText"
                marginTop="8"
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
                variant="displayMdMedium"
                color="primaryText"
                marginTop="8"
                textAlign="center"
              >
                {t('collectablesScreen.rewardsError')}
              </Text>
              <Text
                variant="textSmRegular"
                color="secondaryText"
                marginTop="8"
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
                variant="displayMdMedium"
                color="primaryText"
                marginTop="8"
                textAlign="center"
              >
                {t('antennaSetupScreen.settingUp')}
              </Text>
              <Text
                variant="textXlRegular"
                color="gray.600"
                textAlign="center"
                marginBottom="4"
                marginTop="2"
              >
                {t('antennaSetupScreen.settingUpBody')}
              </Text>
              <Box flexDirection="row" marginHorizontal="12" marginTop="4">
                <IndeterminateProgressBar paddingHorizontal="6" />
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
            marginHorizontal="4"
            marginBottom="4"
            height={65}
            borderRadius="full"
            backgroundColor="base.white"
            backgroundColorOpacity={0.1}
            backgroundColorOpacityPressed={0.05}
            titleColorPressedOpacity={0.3}
            title={t('collectablesScreen.returnToCollectables')}
            titleColor="base.white"
            onPress={onReturn}
            disabled={solanaPayment && solanaPayment.loading}
            LeadingComponent={
              <BackArrow width={16} height={15} color="primaryText" />
            }
          />
        </Box>
      </Box>
    </ReAnimatedBox>
  )
}

export default memo(SettingUpAntennaScreen)
