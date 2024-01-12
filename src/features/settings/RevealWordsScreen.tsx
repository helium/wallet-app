import React, { memo, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAsync } from 'react-async-hook'
import { useNavigation } from '@react-navigation/native'
import { useAccountStorage } from '@storage/AccountStorageProvider'
import Box from '@components/Box'
import BackScreen from '@components/BackScreen'
import TextTransform from '@components/TextTransform'
import { getSecureAccount } from '@storage/secureStorage'
import RevealWords from '@components/RevealWords'

const RevealWordsScreen = () => {
  const { currentAccount } = useAccountStorage()
  const { t } = useTranslation()
  const navigation = useNavigation()
  const [mnemonic, setMnemonic] = useState<string[]>()

  useAsync(async () => {
    if (!currentAccount?.address) return
    const secureAccount = await getSecureAccount(currentAccount.address)
    setMnemonic(secureAccount?.mnemonic)
  }, [currentAccount?.address])

  const ListHeaderComponent = useMemo(() => {
    return (
      <Box
        backgroundColor="red500Transparent10"
        borderRadius="l"
        padding="l"
        marginBottom="l"
        marginTop="s"
      >
        <TextTransform
          textAlign="center"
          variant="body1"
          maxFontSizeMultiplier={1}
          i18nKey="settings.revealWords.subtitle"
          values={{ numWords: mnemonic?.length }}
        />
      </Box>
    )
  }, [mnemonic?.length])

  return (
    <BackScreen
      rootBackgroundColor="black"
      backgroundColor="black"
      flex={1}
      title={
        mnemonic?.length
          ? t('settings.revealWords.title', { numWords: mnemonic.length })
          : ''
      }
      edges={[]}
      padding="none"
    >
      <RevealWords
        mnemonic={mnemonic || []}
        ListHeaderComponent={ListHeaderComponent}
        onDone={navigation.goBack}
      />
    </BackScreen>
  )
}

export default memo(RevealWordsScreen)
