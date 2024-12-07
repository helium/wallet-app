import { useNavigation } from '@react-navigation/native'
import React, { memo, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Box from '@components/Box'
import Text from '@components/Text'
import { useColors, useSpacing } from '@config/theme/themeHooks'
import BackArrow from '@assets/svgs/backArrow.svg'
import ImageBox from '@components/ImageBox'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import ScrollBox from '@components/ScrollBox'
import ButtonPressable from '@components/ButtonPressable'
import Key from '@assets/svgs/key.svg'
import FinePrint from '@components/FinePrint'
import { OnboardingNavigationProp } from './onboardingTypes'
import { OnboardingSheetRef, OnboardingSheetWrapper } from './OnboardingSheet'

const NewAccountScreen = () => {
  const { t } = useTranslation()
  const navigation = useNavigation<OnboardingNavigationProp>()
  const colors = useColors()
  const spacing = useSpacing()
  const { top, bottom } = useSafeAreaInsets()
  const onboardingSheetRef = useRef<OnboardingSheetRef>(null)

  const goBack = useCallback(() => {
    navigation.goBack()
  }, [navigation])

  const onGenerateAPasskey = useCallback(() => {
    onboardingSheetRef.current?.show('create-account')
  }, [onboardingSheetRef])

  return (
    <ScrollBox
      flex={1}
      padding="2xl"
      contentContainerStyle={{ flex: 1, justifyContent: 'center' }}
    >
      <Box
        flexDirection="row"
        justifyContent="center"
        position="absolute"
        top={top + spacing.xl}
        left={spacing['2xl']}
        right={spacing['2xl']}
      >
        <TouchableOpacityBox position="absolute" left={0} onPress={goBack}>
          <BackArrow color={colors['text.quaternary-500']} />
        </TouchableOpacityBox>
        <Text variant="textMdSemibold" color="text.quaternary-500">
          {t('NewAccountScreen.newAccount')}
        </Text>
      </Box>
      <Box alignItems="center" gap="xl" marginBottom="4xl">
        <ImageBox source={require('@assets/images/lock.png')} />
        <Text
          variant="displayMdSemibold"
          color="primaryText"
          textAlign="center"
        >
          {t('NewAccountScreen.title')}
        </Text>
        <Text
          variant="textXlRegular"
          color="text.quaternary-500"
          textAlign="center"
          paddingHorizontal="2xl"
        >
          {t('NewAccountScreen.subtitle')}
        </Text>
      </Box>
      <ButtonPressable
        title={t('NewAccountScreen.generateAPasskey')}
        backgroundColor="cardBackground"
        titleColor="primaryText"
        LeadingComponent={<Key color={colors.primaryBackground} />}
        onPress={onGenerateAPasskey}
      />
      <FinePrint
        position="absolute"
        justifyContent="center"
        paddingBottom="6"
        paddingHorizontal="12"
        bottom={bottom}
        left={0}
        right={0}
      />
      <OnboardingSheetWrapper ref={onboardingSheetRef} />
    </ScrollBox>
  )
}

export default memo(NewAccountScreen)
