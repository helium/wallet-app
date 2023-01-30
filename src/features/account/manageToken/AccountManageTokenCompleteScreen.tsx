import React, { memo } from 'react'
import { useNavigation } from '@react-navigation/native'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import 'text-encoding-polyfill'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import BackArrow from '@assets/images/backArrow.svg'
import { HomeNavigationProp } from '../../home/homeTypes'
import IndeterminateProgressBar from '../../../components/IndeterminateProgressBar'
import FabButton from '../../../components/FabButton'
import { DelayedFadeIn } from '../../../components/FadeInOut'
import Box from '../../../components/Box'
import ButtonPressable from '../../../components/ButtonPressable'
import Text from '../../../components/Text'
import { RootState } from '../../../store/rootReducer'
import { ReAnimatedBox } from '../../../components/AnimatedBox'

const AccountManageTokenCompleteScreen = () => {
  const navigation = useNavigation<HomeNavigationProp>()
  const { t } = useTranslation()
  const splToken = useSelector(
    (reduxState: RootState) => reduxState.solana.splToken,
  )

  return (
    <ReAnimatedBox entering={DelayedFadeIn} flex={1}>
      <Box
        backgroundColor="transparent"
        flex={1}
        padding="m"
        alignItems="center"
        justifyContent="center"
      >
        <Box
          flexGrow={1}
          marginBottom="xl"
          justifyContent="center"
          alignItems="center"
        >
          {splToken && splToken.loading && !splToken?.error && (
            <Animated.View
              style={{ alignItems: 'center' }}
              entering={FadeIn}
              exiting={FadeOut}
            >
              <FabButton
                icon="add"
                backgroundColor="white"
                backgroundColorOpacity={0.1}
                iconColor="white"
                size={60}
                iconSize={26}
                disabled
              />
              <Text
                variant="h2"
                color="white"
                marginTop="m"
                marginBottom="s"
                textAlign="center"
              >
                {t('accountTokenList.addingToken.title')}
              </Text>
              <Text
                variant="body0"
                color="grey600"
                marginBottom="m"
                textAlign="center"
              >
                {t('accountTokenList.addingToken.body')}
              </Text>
              <Box flexDirection="row" marginHorizontal="xxl">
                <IndeterminateProgressBar paddingHorizontal="l" />
              </Box>
            </Animated.View>
          )}

          {splToken && splToken.success && (
            <Animated.View
              style={{ alignItems: 'center' }}
              entering={FadeIn}
              exiting={FadeOut}
            >
              <FabButton
                icon="arrowDown"
                backgroundColor="greenBright500"
                iconColor="black"
                size={60}
                iconSize={26}
                disabled
              />
              <Text
                variant="h2"
                color="white"
                marginTop="m"
                marginBottom="s"
                textAlign="center"
              >
                {t('accountTokenList.tokenAdded.title')}
              </Text>
              <Text variant="body0" color="grey600" textAlign="center">
                {t('accountTokenList.tokenAdded.body')}
              </Text>
            </Animated.View>
          )}

          {splToken && splToken.error && (
            <Animated.View
              style={{ alignItems: 'center' }}
              entering={FadeIn}
              exiting={FadeOut}
            >
              <FabButton
                icon="close"
                backgroundColor="red500"
                backgroundColorOpacity={0.9}
                iconColor="black"
                size={60}
                iconSize={20}
                disabled
              />
              <Text
                variant="h2"
                color="white"
                marginTop="m"
                marginBottom="s"
                textAlign="center"
              >
                {t('accountTokenList.erroAddToken.title')}
              </Text>
              <Text variant="body0" color="grey600" textAlign="center">
                {splToken.error.message}
              </Text>
            </Animated.View>
          )}
        </Box>
        <Box flex={1} width="100%" justifyContent="flex-end">
          <ButtonPressable
            marginHorizontal="m"
            marginBottom="m"
            height={65}
            borderRadius="round"
            backgroundColor="white"
            backgroundColorOpacity={0.1}
            backgroundColorOpacityPressed={0.05}
            titleColorPressedOpacity={0.3}
            title={t('accountTokenList.returnToWallet')}
            titleColor="white"
            onPress={() => navigation.navigate('AccountsScreen')}
            LeadingComponent={
              <BackArrow width={16} height={15} color="white" />
            }
          />
        </Box>
      </Box>
    </ReAnimatedBox>
  )
}

export default memo(AccountManageTokenCompleteScreen)
