import { FocusAwareStatusBar } from '@ui/FocusAwareStatusBar'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { Button } from '@ui/Button'
import { PressableScale } from '@ui/PressableScale'
import { Text } from '@ui/Text'
import { X } from 'lucide-react-native'
import React, { useEffect } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Image, View } from 'react-native'
import { TabSafeAreaView } from '@ui/TabSafeAreaView'
import { withUniwind } from 'uniwind'
import { ImportAccountNavigationProp } from './importAccountNavTypes'
import { useAccountStorage } from '../../../storage/AccountStorageProvider'
import { useOnboarding } from '../OnboardingProvider'
import { MultiAccountStackParamList } from '../multiAccount/MultiAccountNavigatorTypes'
import { AddNewAccountNavigationProp } from '../../home/addNewAccount/addNewAccountTypes'
import { RootNavigationProp } from '../../../navigation/rootTypes'

const SafeArea = withUniwind(TabSafeAreaView)
const CloseIcon = withUniwind(X)

const SUBTITLE_COMPONENTS = {
  havelockBlue: <Text size="xl" className="font-medium text-purple-400" />,
  jazzberryJam: <Text size="xl" className="font-medium text-purple-400" />,
}

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

  const navNext = () => {
    if (hasAccounts) {
      addNewAcctNav.navigate('ImportAccount', {
        screen: 'AccountImportScreen',
        params: {},
      })
    } else {
      navigation.navigate('AccountImportScreen', {})
    }
  }

  const onClose = () => {
    navigation.goBack()
  }

  const importPrivateKey = () => {
    rootNav.navigate('ImportPrivateKey', { key: undefined })
  }

  const cliExport = () => {
    if (hasAccounts) {
      addNewAcctNav.navigate('CLIAccountNavigator')
    } else {
      navigation.navigate('CLIAccountNavigator')
    }
  }

  const isInline = inline || params?.inline

  return (
    <SafeArea edges={['bottom']} className="flex-1 bg-navy">
      <FocusAwareStatusBar barStyle="light-content" />
      {isInline ? null : (
        <PressableScale
          feedback="opacity"
          hitSlop={16}
          className="self-end p-6"
          onPress={onClose}
        >
          <CloseIcon size={16} colorClassName="accent-navy-foreground" />
        </PressableScale>
      )}
      <View className="flex-1 items-center justify-center px-6">
        <Image source={require('@assets/images/fingerprint.png')} />
        <Text
          size="4xl"
          className="mb-2 mt-6 text-center font-medium leading-[44px] text-navy-foreground"
        >
          {t('accountImport.title')}
        </Text>
        <Text
          size="xl"
          className="text-center font-medium text-navy-foreground/50"
        >
          <Trans
            i18nKey="accountImport.subTitle"
            components={SUBTITLE_COMPONENTS}
          />
        </Text>
      </View>
      <Text
        size={reachedAccountLimit ? 'base' : 'xl'}
        className={
          reachedAccountLimit
            ? 'mx-6 mb-6 text-center font-medium text-destructive'
            : 'mx-6 mb-6 text-center font-medium text-navy-foreground/50'
        }
      >
        {reachedAccountLimit
          ? t('accountImport.accountLimit')
          : t('accountImport.pickKeyType')}
      </Text>
      <View className="mx-6 mb-6 flex-row gap-1">
        <Button
          variant="cta"
          size="lg"
          className="flex-1 px-2"
          onPress={navNext}
          testID="AccountImportStart.SecretPhrase"
          disabled={reachedAccountLimit}
        >
          {t('accountImport.recoveryPhrase')}
        </Button>
        <Button
          variant="secondary"
          size="lg"
          className="flex-1 px-2"
          onPress={importPrivateKey}
          disabled={reachedAccountLimit}
        >
          {t('accountImport.keyImport')}
        </Button>
        <Button
          variant="secondary"
          size="lg"
          className="flex-1 px-2"
          onPress={cliExport}
          disabled={reachedAccountLimit}
        >
          {t('accountImport.cliImport')}
        </Button>
      </View>
    </SafeArea>
  )
}

export default AccountImportStartScreen
