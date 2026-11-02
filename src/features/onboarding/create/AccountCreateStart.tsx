import { FocusAwareStatusBar } from '@ui/FocusAwareStatusBar'
import { useNavigation } from '@react-navigation/native'
import { Button } from '@ui/Button'
import { PressableScale } from '@ui/PressableScale'
import { Text } from '@ui/Text'
import { CirclePlus, X } from 'lucide-react-native'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context'
import { withUniwind } from 'uniwind'
import { useAccountStorage } from '../../../storage/AccountStorageProvider'
import { CreateAccountNavigationProp } from './createAccountNavTypes'

const SafeAreaView = withUniwind(RNSafeAreaView)
const CloseIcon = withUniwind(X)
const CreateIcon = withUniwind(CirclePlus)

type Props = { onCreate: () => void; inline?: boolean }
const AccountCreateStart = ({ onCreate, inline }: Props) => {
  const { t } = useTranslation()
  const { reachedAccountLimit } = useAccountStorage()
  const navigation = useNavigation<CreateAccountNavigationProp>()

  return (
    <SafeAreaView className="flex-1 bg-navy px-6">
      <FocusAwareStatusBar barStyle="light-content" />
      {!inline && (
        <View className="w-full items-end">
          <PressableScale
            feedback="opacity"
            hitSlop={16}
            className="py-4"
            onPress={() => navigation.goBack()}
          >
            <CloseIcon size={16} colorClassName="accent-navy-foreground" />
          </PressableScale>
        </View>
      )}
      <View className="flex-1 items-center justify-center">
        <CreateIcon size={72} colorClassName="accent-purple-400" />
        <Text
          size="4xl"
          className="mt-6 text-center font-medium text-navy-foreground"
        >
          {t('accountSetup.title')}
        </Text>
        <Text size="lg" className="my-4 text-center text-navy-foreground/50">
          {t('accountSetup.subtitle1')}
        </Text>
        {!reachedAccountLimit && (
          <Text size="lg" className="text-center text-purple-400">
            {t('accountSetup.subtitle2')}
          </Text>
        )}
      </View>
      {reachedAccountLimit && (
        <Text
          size="base"
          className="mb-6 text-center font-medium text-destructive"
        >
          {t('accountImport.accountLimit')}
        </Text>
      )}
      <Button
        testID="AccountCreateStart.Create"
        variant="cta"
        size="dashboard"
        className="mb-6 w-full"
        disabled={reachedAccountLimit}
        onPress={onCreate}
      >
        {t('accountSetup.createButtonTitle')}
      </Button>
    </SafeAreaView>
  )
}

export default AccountCreateStart
