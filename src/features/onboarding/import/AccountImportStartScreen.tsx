import React, { memo, useCallback, useEffect, useMemo } from 'react'
import { useNavigation } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import { Image } from 'react-native'
import { Edge } from 'react-native-safe-area-context'
import Text from '../../../components/Text'
import Box from '../../../components/Box'
import { useOnboarding } from '../OnboardingProvider'
import ButtonPressable from '../../../components/ButtonPressable'
import TextTransform from '../../../components/TextTransform'
import { ImportAccountNavigationProp } from './importAccountNavTypes'
import { HomeNavigationProp } from '../../home/homeTypes'
import { useAccountStorage } from '../../../storage/AccountStorageProvider'
import FinePrint from '../../../components/FinePrint'
import SafeAreaBox from '../../../components/SafeAreaBox'

const AccountImportStartScreen = () => {
  const { setOnboardingData } = useOnboarding()
  const navigation = useNavigation<ImportAccountNavigationProp>()
  const homeNav = useNavigation<HomeNavigationProp>()
  const { hasAccounts, reachedAccountLimit } = useAccountStorage()
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

  const edges = useMemo((): Edge[] => ['bottom'], [])

  return (
    <SafeAreaBox flex={1} flexDirection="column" edges={edges}>
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
          variant="subtitle1"
          textAlign="center"
          color="secondaryText"
          i18nKey="accountImport.subTitle"
        />
      </Box>
      <Text
        variant={reachedAccountLimit ? 'body1' : 'subtitle1'}
        textAlign="center"
        marginBottom="l"
        marginHorizontal="l"
        color={reachedAccountLimit ? 'error' : 'secondaryText'}
        fontWeight={reachedAccountLimit ? '500' : undefined}
      >
        {reachedAccountLimit
          ? t('accountImport.accountLimit')
          : t('accountImport.pickKeyType')}
      </Text>
      <Box flexDirection="row" marginHorizontal="l">
        <ButtonPressable
          width="50%"
          marginRight="xxs"
          borderTopLeftRadius="round"
          borderBottomLeftRadius="round"
          backgroundColor="havelockBlue"
          titleColor="black900"
          title={t('accountImport.restoreChoice', { totalWords: 12 })}
          onPress={navNext(12)}
          titleColorDisabled="black800"
          backgroundColorOpacityPressed={0.7}
          backgroundColorDisabled="havelockBlue"
          backgroundColorDisabledOpacity={0.4}
          disabled={reachedAccountLimit}
        />
        <ButtonPressable
          width="50%"
          marginLeft="xxs"
          borderTopRightRadius="round"
          borderBottomRightRadius="round"
          backgroundColor="jazzberryJam"
          titleColor="black900"
          title={t('accountImport.restoreChoice', { totalWords: 24 })}
          onPress={navNext(24)}
          titleColorDisabled="black800"
          backgroundColorOpacityPressed={0.7}
          backgroundColorDisabled="jazzberryJam"
          backgroundColorDisabledOpacity={0.4}
          disabled={reachedAccountLimit}
        />
      </Box>
      <FinePrint marginHorizontal="xl" marginTop="l" justifyContent="center" />
    </SafeAreaBox>
  )
}

export default memo(AccountImportStartScreen)
