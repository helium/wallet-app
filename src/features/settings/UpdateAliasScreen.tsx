import React, { memo, useCallback, useState } from 'react'
import { useNavigation } from '@react-navigation/native'
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Box from '../../components/Box'
import TextInput from '../../components/TextInput'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import FabButton from '../../components/FabButton'
import { useSpacing } from '../../theme/themeHooks'
import AccountIcon from '../../components/AccountIcon'
import { SettingsNavigationProp } from './settingsTypes'
import BackScreen from '../../components/BackScreen'

const UpdateAliasScreen = () => {
  const navigation = useNavigation<SettingsNavigationProp>()
  const [alias, setAlias] = useState('')
  const insets = useSafeAreaInsets()
  const spacing = useSpacing()
  const { upsertAccount, hasAccounts, currentAccount } = useAccountStorage()

  const handlePress = useCallback(async () => {
    if (hasAccounts && currentAccount?.address) {
      try {
        await upsertAccount({ ...currentAccount, alias })
        navigation.popToTop()
        return
      } catch (e) {
        console.error(e)
      }
    }
  }, [hasAccounts, upsertAccount, currentAccount, alias, navigation])

  return (
    <BackScreen
      backgroundColor="primaryBackground"
      flex={1}
      paddingHorizontal={{ smallPhone: 'l', phone: 'xxxl' }}
    >
      <KeyboardAvoidingView
        keyboardVerticalOffset={insets.top + spacing.xxl}
        behavior={Platform.OS === 'android' ? 'height' : 'padding'}
        style={styles.container}
      >
        <Box alignItems="center" flex={1}>
          <AccountIcon size={84} address={currentAccount?.address || ''} />

          <TextInput
            onChangeText={setAlias}
            variant="underline"
            value={alias}
            autoFocus
            placeholder={currentAccount?.alias}
            autoCorrect={false}
            autoComplete="off"
            marginTop="xl"
            autoCapitalize="words"
            width="100%"
          />

          <Box flex={1} />

          <FabButton
            onPress={handlePress}
            icon="arrowRight"
            disabled={!alias}
            backgroundColor="surface"
            backgroundColorPressed="surfaceContrast"
            backgroundColorOpacityPressed={0.1}
          />
        </Box>
      </KeyboardAvoidingView>
    </BackScreen>
  )
}

const styles = StyleSheet.create({
  container: { width: '100%', flex: 1 },
})

export default memo(UpdateAliasScreen)
