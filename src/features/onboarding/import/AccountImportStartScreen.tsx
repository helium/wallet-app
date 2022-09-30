import React, { memo, useCallback, useEffect, useMemo } from 'react'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import { Image } from 'react-native'
import { Edge } from 'react-native-safe-area-context'
import Text from '../../../components/Text'
import Box from '../../../components/Box'
import { useOnboarding } from '../OnboardingProvider'
import ButtonPressable from '../../../components/ButtonPressable'
import TextTransform from '../../../components/TextTransform'
import { ImportAccountNavigationProp } from './importAccountNavTypes'
import { useAccountStorage } from '../../../storage/AccountStorageProvider'
import SafeAreaBox from '../../../components/SafeAreaBox'
import CloseButton from '../../../components/CloseButton'
import { MultiAccountStackParamList } from '../multiAccount/MultiAccountNavigatorTypes'
import { AddNewAccountNavigationProp } from '../../home/addNewAccount/addNewAccountTypes'

type Route = RouteProp<MultiAccountStackParamList, 'AccountImportStartScreen'>

const AccountImportStartScreen = ({ inline }: { inline?: boolean }) => {
  const { setOnboardingData } = useOnboarding()
  const navigation = useNavigation<ImportAccountNavigationProp>()
  const addNewAcctNav = useNavigation<AddNewAccountNavigationProp>()
  const { hasAccounts, reachedAccountLimit } = useAccountStorage()
  const { t } = useTranslation()
  const { params } = useRoute<Route>()

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
        addNewAcctNav.navigate('ImportAccount', {
          screen: 'AccountImportScreen',
          params: { wordCount },
        })
      } else {
        navigation.navigate('AccountImportScreen', { wordCount })
      }
    },
    [hasAccounts, addNewAcctNav, navigation],
  )

  const onClose = useCallback(() => {
    navigation.goBack()
  }, [navigation])

  const cliExport = useCallback(
    () => () => {
      if (hasAccounts) {
        addNewAcctNav.navigate('CLIAccountNavigator')
      } else {
        navigation.navigate('CLIAccountNavigator')
      }
    },
    [hasAccounts, addNewAcctNav, navigation],
  )

  const edges = useMemo((): Edge[] => ['bottom'], [])

  const isInline = useMemo(() => {
    return inline || params?.inline
  }, [inline, params])

  return (
    <SafeAreaBox
      flex={1}
      flexDirection="column"
      edges={edges}
      backgroundColor="secondary"
    >
      {isInline ? null : (
        <CloseButton alignSelf="flex-end" padding="l" onPress={onClose} />
      )}
      <Box
        flex={1}
        justifyContent="center"
        alignItems="center"
        paddingHorizontal="l"
      >
        <Image source={require('@assets/images/fingerprint.png')} />
        <Text
          variant="h1"
          fontSize={44}
          marginTop="l"
          marginBottom="s"
          textAlign="center"
          lineHeight={44}
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
      <Box flexDirection="row" marginHorizontal="l" marginBottom="l">
        <ButtonPressable
          width="33%"
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
          fontWeight="500"
          disabled={reachedAccountLimit}
        />
        <ButtonPressable
          width="33%"
          marginLeft="xxs"
          marginRight="xxs"
          backgroundColor="jazzberryJam"
          titleColor="black900"
          title={t('accountImport.restoreChoice', { totalWords: 24 })}
          onPress={navNext(24)}
          titleColorDisabled="black800"
          backgroundColorOpacityPressed={0.7}
          backgroundColorDisabled="jazzberryJam"
          backgroundColorDisabledOpacity={0.4}
          fontWeight="500"
          disabled={reachedAccountLimit}
        />
        <ButtonPressable
          width="33%"
          borderTopRightRadius="round"
          borderBottomRightRadius="round"
          backgroundColor="grey350"
          titleColor="black900"
          title={t('accountImport.cliImport')}
          onPress={cliExport()}
          titleColorDisabled="black800"
          backgroundColorOpacityPressed={0.7}
          backgroundColorDisabled="jazzberryJam"
          backgroundColorDisabledOpacity={0.4}
          fontWeight="500"
          disabled={reachedAccountLimit}
        />
      </Box>
    </SafeAreaBox>
  )
}

export default memo(AccountImportStartScreen)
