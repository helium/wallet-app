import useAlert from '@hooks/useAlert'
import useCopyText from '@hooks/useCopyText'
import useSecureWindow from '@hooks/useSecureWindow'
import { useNavigation } from '@react-navigation/native'
import { Button } from '@ui/Button'
import { PressableScale } from '@ui/PressableScale'
import { Text } from '@ui/Text'
import { Copy } from 'lucide-react-native'
import React, { useEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { withUniwind } from 'uniwind'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { getSecureAccount } from '../../storage/secureStorage'
import SettingsBackHeader from './SettingsBackHeader'

const CopyIcon = withUniwind(Copy)

const SUBTITLE_COMPONENTS = {
  secondaryText: <Text size="base" className="text-muted-foreground" />,
  red500: <Text size="base" className="text-destructive" />,
}

const RevealPrivateKeyScreen = () => {
  const { currentAccount } = useAccountStorage()
  const { t } = useTranslation()
  const navigation = useNavigation()
  const { bottom } = useSafeAreaInsets()
  const [privateKey, setPrivateKey] = useState<string>()
  const [revealed, setRevealed] = useState(false)
  const { showOKCancelAlert } = useAlert()
  const copyText = useCopyText()
  useSecureWindow()

  useEffect(() => {
    const run = async () => {
      // don't remove key from secure store until they press reveal
      if (!revealed) return
      if (!currentAccount?.address) return
      const secureAccount = await getSecureAccount(currentAccount.address)
      if (!secureAccount?.keypair.sk) return
      setPrivateKey(
        JSON.stringify(
          Buffer.from(secureAccount?.keypair?.sk, 'base64').toJSON().data,
        ),
      )
    }
    run().catch((e) => console.error(e))
  }, [currentAccount?.address, revealed])

  const showConfirmDialog = async () => {
    const decision = await showOKCancelAlert({
      title: t('settings.revealPrivateKey.alertTitle'),
      message: t('settings.revealPrivateKey.alertMessage'),
    })
    setRevealed(decision)
  }

  return (
    <View className="flex-1 bg-background" style={{ paddingBottom: bottom }}>
      <SettingsBackHeader onBack={navigation.goBack} />
      <View className="flex-1 px-6">
        <Text
          size="4xl"
          className="mt-8 font-semibold"
          maxFontSizeMultiplier={1}
        >
          {t('settings.revealPrivateKey.title')}
        </Text>
        <Text size="base" className="mb-8 mt-4" maxFontSizeMultiplier={1}>
          <Trans
            i18nKey="settings.revealPrivateKey.subtitle"
            components={SUBTITLE_COMPONENTS}
          />
        </Text>
        {revealed ? (
          <>
            <View className="mx-1 my-6 h-[140px] justify-center rounded-md bg-secondary p-6">
              <Text className="text-xs" maxFontSizeMultiplier={1} selectable>
                {privateKey}
              </Text>
            </View>
            <Button
              variant="cta"
              size="lg"
              className="w-full"
              onPress={() =>
                copyText({
                  message: t('generic.copy'),
                  copyText: privateKey || '',
                })
              }
            >
              <CopyIcon size={16} colorClassName="accent-white" />
              <Text className="font-medium text-white">
                {t('generic.copy')}
              </Text>
            </Button>
          </>
        ) : (
          <PressableScale
            feedback="opacity"
            onPress={() => void showConfirmDialog().catch(console.error)}
            className="mx-1 my-6 h-24 justify-center rounded-md bg-secondary p-6"
          >
            <Text
              size="lg"
              className="text-center font-bold"
              maxFontSizeMultiplier={1}
            >
              {t('settings.revealPrivateKey.tap')}
            </Text>
          </PressableScale>
        )}
        <View className="flex-1" />
        <Button
          variant="secondary"
          size="lg"
          className="mb-4 w-full"
          onPress={navigation.goBack}
        >
          {t('settings.revealPrivateKey.done')}
        </Button>
      </View>
    </View>
  )
}

export default RevealPrivateKeyScreen
