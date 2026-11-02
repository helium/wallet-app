import { useNavigation } from '@react-navigation/native'
import { useAccountStorage } from '@storage/AccountStorageProvider'
import { AccountIcon } from '@ui/AccountIcon'
import { Button } from '@ui/Button'
import { Input } from '@ui/Input'
import { TabSafeAreaView } from '@ui/TabSafeAreaView'
import { Text } from '@ui/Text'
import { ArrowRight } from 'lucide-react-native'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { KeyboardAvoidingView, Platform, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { withUniwind } from 'uniwind'
import SettingsBackHeader from './SettingsBackHeader'
import { SettingsNavigationProp } from './settingsTypes'

const ArrowIcon = withUniwind(ArrowRight)
const SafeArea = withUniwind(TabSafeAreaView)
const StyledKeyboardAvoidingView = withUniwind(KeyboardAvoidingView)

// the back header (top inset + its row) sits above the avoiding view
const HEADER_OFFSET = 56

const UpdateAliasScreen = () => {
  const navigation = useNavigation<SettingsNavigationProp>()
  const [alias, setAlias] = useState('')
  const insets = useSafeAreaInsets()
  const { upsertAccount, hasAccounts, currentAccount } = useAccountStorage()
  const { t } = useTranslation()

  const handlePress = async () => {
    if (hasAccounts && currentAccount?.address) {
      try {
        await upsertAccount({ ...currentAccount, alias })
        navigation.popToTop()
      } catch (e) {
        console.error(e)
      }
    }
  }

  return (
    <SafeArea edges={['bottom']} className="flex-1 bg-background">
      <SettingsBackHeader onBack={navigation.goBack} />
      <StyledKeyboardAvoidingView
        keyboardVerticalOffset={insets.top + HEADER_OFFSET}
        behavior={Platform.OS === 'android' ? 'height' : 'padding'}
        className="w-full flex-1 items-center px-8"
      >
        <Text size="4xl" className="text-center font-semibold">
          {t('accountAssign.title')}
        </Text>
        <View className="mt-8 w-full flex-row items-center gap-4 rounded-[16px] bg-secondary p-4">
          <AccountIcon size={40} address={currentAccount?.address || ''} />
          <Input
            className="h-12 w-auto flex-1 border-0 px-0 text-2xl shadow-none"
            onChangeText={setAlias}
            value={alias}
            placeholder={currentAccount?.alias}
            autoCorrect={false}
            autoComplete="off"
            autoCapitalize="words"
          />
        </View>

        <View className="flex-1" />

        <Button
          variant="cta"
          size="icon"
          className="mb-4 size-16 rounded-full"
          accessibilityLabel={t('generic.next')}
          disabled={!alias}
          onPress={() => void handlePress().catch(console.error)}
        >
          <ArrowIcon size={24} colorClassName="accent-white" />
        </Button>
      </StyledKeyboardAvoidingView>
    </SafeArea>
  )
}

export default UpdateAliasScreen
