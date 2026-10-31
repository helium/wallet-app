import { useNavigation } from '@react-navigation/native'
import { useAccountStorage } from '@storage/AccountStorageProvider'
import { getSecureAccount } from '@storage/secureStorage'
import { RevealWords } from '@ui/RevealWords'
import { Text } from '@ui/Text'
import React, { useEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { View } from 'react-native'
import SettingsBackHeader from './SettingsBackHeader'

const SUBTITLE_COMPONENTS = {
  secondaryText: <Text size="base" className="text-muted-foreground" />,
  red500: <Text size="base" className="text-destructive" />,
}

const RevealWordsScreen = () => {
  const { currentAccount } = useAccountStorage()
  const { t } = useTranslation()
  const navigation = useNavigation()
  const [mnemonic, setMnemonic] = useState<string[]>()

  useEffect(() => {
    const run = async () => {
      if (!currentAccount?.address) return
      const secureAccount = await getSecureAccount(currentAccount.address)
      setMnemonic(secureAccount?.mnemonic)
    }
    run().catch((e) => console.error(e))
  }, [currentAccount?.address])

  return (
    <View className="flex-1 bg-black">
      <SettingsBackHeader
        onBack={navigation.goBack}
        title={
          mnemonic?.length
            ? t('settings.revealWords.title', { numWords: mnemonic.length })
            : ''
        }
      />
      <RevealWords
        mnemonic={mnemonic || []}
        ListHeaderComponent={
          <View className="mb-6 mt-2 rounded-[12px] bg-destructive/10 p-6">
            <Text size="base" className="text-center" maxFontSizeMultiplier={1}>
              <Trans
                i18nKey="settings.revealWords.subtitle"
                components={SUBTITLE_COMPONENTS}
                values={{ numWords: mnemonic?.length }}
              />
            </Text>
          </View>
        }
        onDone={navigation.goBack}
      />
    </View>
  )
}

export default RevealWordsScreen
