import React, { memo, useCallback, useEffect, useMemo } from 'react'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import { Image } from 'react-native'
import { Edge } from 'react-native-safe-area-context'
import Text from '@components/Text'
import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import TextTransform from '@components/TextTransform'
import SafeAreaBox from '@components/SafeAreaBox'
import CloseButton from '@components/CloseButton'
import { useAccountStorage } from '@config/storage/AccountStorageProvider'
import { ImportAccountNavigationProp } from './importAccountNavTypes'
import { useOnboarding } from '../OnboardingProvider'
import { MultiAccountStackParamList } from '../multiAccount/MultiAccountNavigatorTypes'
import { AddNewAccountNavigationProp } from '../../home/addNewAccount/addNewAccountTypes'
import { RootNavigationProp } from '../../../app/rootTypes'

type Route = RouteProp<MultiAccountStackParamList, 'AccountImportStartScreen'>

const AccountImportStartScreen = ({ inline }: { inline?: boolean }) => {
  const { setOnboardingData } = useOnboarding()
  const navigation = useNavigation<ImportAccountNavigationProp>()
  const rootNav = useNavigation<RootNavigationProp>()
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
    () => () => {
      if (hasAccounts) {
        addNewAcctNav.navigate('ImportAccount', {
          screen: 'AccountImportScreen',
          params: {},
        })
      } else {
        navigation.navigate('AccountImportScreen', {})
      }
    },
    [hasAccounts, addNewAcctNav, navigation],
  )

  const onClose = useCallback(() => {
    navigation.goBack()
  }, [navigation])

  const importPrivateKey = useCallback(() => {
    rootNav.navigate('ImportPrivateKey', { key: undefined })
  }, [rootNav])

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
      backgroundColor="primaryBackground"
    >
      {isInline ? null : (
        <CloseButton alignSelf="flex-end" padding="6" onPress={onClose} />
      )}
      <Box
        flex={1}
        justifyContent="center"
        alignItems="center"
        paddingHorizontal="6"
      >
        <Image source={require('@assets/images/fingerprint.png')} />
        <Text
          variant="displayMdRegular"
          fontSize={44}
          marginTop="6"
          marginBottom="2"
          textAlign="center"
          lineHeight={44}
          color="primaryText"
        >
          {t('accountImport.title')}
        </Text>
        <TextTransform
          variant="textXlMedium"
          textAlign="center"
          color="secondaryText"
          i18nKey="accountImport.subTitle"
        />
      </Box>
      <Text
        variant={reachedAccountLimit ? 'textMdRegular' : 'textXlMedium'}
        textAlign="center"
        marginBottom="6"
        marginHorizontal="6"
        color={reachedAccountLimit ? 'error.500' : 'secondaryText'}
        fontWeight={reachedAccountLimit ? '500' : undefined}
      >
        {reachedAccountLimit
          ? t('accountImport.accountLimit')
          : t('accountImport.pickKeyType')}
      </Text>
      <Box flexDirection="row" marginHorizontal="6" marginBottom="6">
        <ButtonPressable
          width="33%"
          borderTopLeftRadius="full"
          borderBottomLeftRadius="full"
          backgroundColor="blue.500"
          titleColor="base.black"
          title={t('accountImport.recoveryPhrase')}
          onPress={navNext()}
          titleColorDisabled="text.disabled"
          backgroundColorOpacityPressed={0.7}
          backgroundColorDisabled="blue.500"
          backgroundColorDisabledOpacity={0.4}
          fontWeight="500"
          fontSize={18}
          disabled={reachedAccountLimit}
        />
        <ButtonPressable
          width="33%"
          marginLeft="0.5"
          backgroundColor="gray.500"
          titleColor="base.black"
          title={t('accountImport.keyImport')}
          onPress={importPrivateKey}
          titleColorDisabled="text.disabled"
          backgroundColorOpacityPressed={0.7}
          backgroundColorDisabled="gray.500"
          backgroundColorDisabledOpacity={0.4}
          fontWeight="500"
          fontSize={18}
          disabled={reachedAccountLimit}
        />
        <ButtonPressable
          width="33%"
          marginLeft="0.5"
          backgroundColor="pink.500"
          titleColor="base.black"
          title={t('accountImport.cliImport')}
          onPress={cliExport()}
          titleColorDisabled="text.disabled"
          backgroundColorOpacityPressed={0.7}
          backgroundColorDisabled="pink.500"
          backgroundColorDisabledOpacity={0.4}
          fontWeight="500"
          fontSize={18}
          disabled={reachedAccountLimit}
          borderTopRightRadius="full"
          borderBottomRightRadius="full"
        />
      </Box>
    </SafeAreaBox>
  )
}

export default memo(AccountImportStartScreen)
