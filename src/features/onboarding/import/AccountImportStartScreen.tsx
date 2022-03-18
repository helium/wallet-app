import React, { useCallback, useEffect } from 'react'
import { useNavigation } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import { Image } from 'react-native'
import Text from '../../../components/Text'
import Box from '../../../components/Box'
import { useOnboarding } from '../OnboardingProvider'
import ButtonPressable from '../../../components/ButtonPressable'
import TextTransform from '../../../components/TextTransform'
import { ImportAccountNavigationProp } from './importAccountNavTypes'
import { HomeNavigationProp } from '../../home/homeTypes'
import { useAccountStorage } from '../../../storage/AccountStorageProvider'

const AccountImportStartScreen = () => {
  const { setOnboardingData } = useOnboarding()
  const navigation = useNavigation<ImportAccountNavigationProp>()
  const homeNav = useNavigation<HomeNavigationProp>()
  const { hasAccounts } = useAccountStorage()
  const { t } = useTranslation()

  useEffect(() => {
    return navigation.addListener('focus', () => {
      setOnboardingData((prev) => {
        return { ...prev, words: [] }
      })
    })
  }, [navigation, setOnboardingData])

  const navNext = useCallback(
    (wordCount: 12 | 24) => () => {
      if (hasAccounts) {
        homeNav.navigate('ImportAccount', {
          screen: 'AccountImportScreen',
          params: { wordCount },
        })
      } else {
        navigation.navigate('AccountImportScreen', { wordCount })
      }
    },
    [hasAccounts, homeNav, navigation],
  )

  return (
    <Box flex={1} flexDirection="column">
      <Box flex={1} justifyContent="center" alignItems="center">
        <Image source={require('@assets/images/fingerprint.png')} />
        <Text
          variant="h2"
          marginVertical="m"
          textAlign="center"
          lineHeight={34}
        >
          {t('accountImport.title')}
        </Text>
        <TextTransform
          variant="body1"
          textAlign="center"
          color="secondaryText"
          i18nKey="accountImport.subTitle"
        />
      </Box>
      <Text
        variant="body1"
        textAlign="center"
        marginBottom="l"
        color="secondaryText"
      >
        {t('accountImport.pickKeyType')}
      </Text>
      <Box flexDirection="row" marginBottom="xxl" marginHorizontal="l">
        <ButtonPressable
          width="50%"
          height={60}
          marginRight="xxs"
          borderTopLeftRadius="round"
          borderBottomLeftRadius="round"
          backgroundColor="havelockBlue"
          titleColor="black900"
          title={t('accountImport.restoreChoice', { totalWords: 12 })}
          onPress={navNext(12)}
        />
        <ButtonPressable
          width="50%"
          height={60}
          marginLeft="xxs"
          borderTopRightRadius="round"
          borderBottomRightRadius="round"
          backgroundColor="jazzberryJam"
          titleColor="black900"
          title={t('accountImport.restoreChoice', { totalWords: 24 })}
          onPress={navNext(24)}
        />
      </Box>
    </Box>
  )
}

export default AccountImportStartScreen
