import React, { memo, useCallback, useState } from 'react'
import { useNavigation } from '@react-navigation/native'
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import Box from '@components/Box'
import TextInput from '@components/TextInput'
import { useAccountStorage } from '@storage/AccountStorageProvider'
import FabButton from '@components/FabButton'
import { useSpacing } from '@theme/themeHooks'
import AccountIcon from '@components/AccountIcon'
import BackScreen from '@components/BackScreen'
import Text from '@components/Text'
import { SettingsNavigationProp } from './settingsTypes'

const UpdateAliasScreen = () => {
  const navigation = useNavigation<SettingsNavigationProp>()
  const [alias, setAlias] = useState('')
  const insets = useSafeAreaInsets()
  const spacing = useSpacing()
  const { upsertAccount, hasAccounts, currentAccount } = useAccountStorage()
  const { t } = useTranslation()

  const handlePress = useCallback(async () => {
    if (hasAccounts && currentAccount?.address) {
      try {
        await upsertAccount({ ...currentAccount, alias })
        navigation.popToTop()
      } catch (e) {
        console.error(e)
      }
    }
  }, [hasAccounts, upsertAccount, currentAccount, alias, navigation])

  return (
    <BackScreen
      backgroundColor="primaryBackground"
      flex={1}
      paddingHorizontal="xl"
    >
      <KeyboardAvoidingView
        keyboardVerticalOffset={insets.top + spacing.xxxl + spacing.xxl}
        behavior={Platform.OS === 'android' ? 'height' : 'padding'}
        style={styles.container}
      >
        <Box alignItems="center" flex={1}>
          <Text variant="h1" textAlign="center" fontSize={44} lineHeight={44}>
            {t('accountAssign.title')}
          </Text>
          <Box
            backgroundColor="transparent10"
            borderRadius="xl"
            padding="m"
            width="100%"
            marginTop="xl"
            flexDirection="row"
          >
            <AccountIcon size={40} address={currentAccount?.address || ''} />
            <TextInput
              textColor="primaryText"
              textInputProps={{
                onChangeText: setAlias,
                value: alias,
                placeholder: currentAccount?.alias,
                autoCorrect: false,
                autoComplete: 'off',
                autoCapitalize: 'words',
              }}
              fontSize={24}
              marginLeft="m"
              marginRight="xl"
            />
          </Box>

          <Box flex={1} />

          <FabButton
            onPress={handlePress}
            icon="arrowRight"
            disabled={!alias}
            backgroundColor="primaryText"
            iconColor="primary"
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
