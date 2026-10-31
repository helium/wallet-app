import FocusAwareStatusBar from '@components/FocusAwareStatusBar'
import Keystone from '@assets/images/keystoneLogo.svg'
import LedgerLogo from '@assets/images/ledger.svg'
import { useNavigation } from '@react-navigation/native'
import { PressableScale } from '@ui/PressableScale'
import { Text } from '@ui/Text'
import { Download, Plus } from 'lucide-react-native'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import {
  SafeAreaView as RNSafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context'
import { withUniwind } from 'uniwind'
import FinePrint from './FinePrint'
import NetTypeSegment from './NetTypeSegment'
import { OnboardingNavigationProp } from './onboardingTypes'

const SafeAreaView = withUniwind(RNSafeAreaView)
const ImportIcon = withUniwind(Download)
const CreateIcon = withUniwind(Plus)
const Ledger = withUniwind(LedgerLogo)

const CreateImportAccountScreen = () => {
  const { t } = useTranslation()
  const navigation = useNavigation<OnboardingNavigationProp>()
  const { bottom } = useSafeAreaInsets()

  return (
    <SafeAreaView className="flex-1 justify-center bg-navy px-6">
      <FocusAwareStatusBar barStyle="light-content" />
      <NetTypeSegment className="-mt-12 mb-6" />
      <Text size="4xl" className="font-medium text-navy-foreground">
        {t('accountSetup.createImport.title')}
      </Text>
      <View className="my-6 overflow-hidden rounded-3xl bg-navy-glass">
        <PressableScale
          testID="CreateImport.Import"
          feedback="opacity"
          className="flex-row items-center p-5"
          onPress={() => navigation.navigate('ImportAccount')}
        >
          <Text size="lg" className="flex-1 text-purple-400">
            {t('accountSetup.createImport.import')}
          </Text>
          <ImportIcon size={20} colorClassName="accent-purple-400" />
        </PressableScale>
        <View className="h-px bg-navy" />
        <PressableScale
          testID="CreateImport.Create"
          feedback="opacity"
          className="flex-row items-center p-5"
          onPress={() => navigation.navigate('CreateAccount')}
        >
          <Text size="lg" className="flex-1 text-purple-400">
            {t('accountSetup.createImport.create')}
          </Text>
          <CreateIcon size={20} colorClassName="accent-purple-400" />
        </PressableScale>
        <View className="h-px bg-navy" />
        <PressableScale
          feedback="opacity"
          className="flex-row items-center p-5"
          onPress={() => navigation.navigate('KeystoneNavigator')}
        >
          <Text size="lg" className="flex-1 text-navy-foreground">
            {t('accountSetup.createImport.keystone')}
          </Text>
          <Keystone height={20} width={20} />
        </PressableScale>
        <View className="h-px bg-navy" />
        <PressableScale
          feedback="opacity"
          className="flex-row items-center p-5"
          onPress={() => navigation.navigate('LedgerNavigator')}
        >
          <Text size="lg" className="flex-1 text-navy-foreground">
            {t('accountSetup.createImport.ledger')}
          </Text>
          <Ledger
            height={20}
            width={20}
            colorClassName="accent-navy-foreground"
          />
        </PressableScale>
      </View>
      <View className="absolute inset-x-0 px-12 pb-6" style={{ bottom }}>
        <FinePrint className="justify-center" />
      </View>
    </SafeAreaView>
  )
}

export default CreateImportAccountScreen
