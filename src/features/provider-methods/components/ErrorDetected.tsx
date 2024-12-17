import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import ImageBox from '@components/ImageBox'
import ScrollBox from '@components/ScrollBox'
import Text from '@components/Text'
import { useSpacing } from '@config/theme/themeHooks'
import { useNavigation } from '@react-navigation/native'
import React, { memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ViewStyle } from 'react-native'

const ErrorDetected = () => {
  const spacing = useSpacing()
  const navigation = useNavigation()
  const { t } = useTranslation()

  const onBack = useCallback(() => {
    navigation.goBack()
  }, [navigation])

  const contentContainerStyle = useMemo(() => {
    return {
      flexGrow: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing['2xl'],
      gap: spacing.xl,
    }
  }, [spacing])

  return (
    <ScrollBox
      padding="2xl"
      contentContainerStyle={contentContainerStyle as ViewStyle}
    >
      <ImageBox source={require('@assets/images/connectLogo.png')} />
      <Text variant="displayMdSemibold" color="primaryText" textAlign="center">
        {t('ErrorDetected.title')}
      </Text>
      <Text
        variant="textXlRegular"
        color="text.quaternary-500"
        textAlign="center"
      >
        {t('ErrorDetected.subtitle', { appName: 'Builder App' })}
      </Text>

      <Box flexDirection="row" marginTop="3xl">
        <Box flex={1} gap="2">
          <ButtonPressable
            flex={1}
            title={t('generic.back')}
            backgroundColor="primaryText"
            titleColor="primaryBackground"
            onPress={onBack}
          />
        </Box>
      </Box>
    </ScrollBox>
  )
}

export default memo(ErrorDetected)
