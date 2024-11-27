import React, { memo, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAsync } from 'react-async-hook'
import { useNavigation } from '@react-navigation/native'
import { useAccountStorage } from '@config/storage/AccountStorageProvider'
import Box from '@components/Box'
import BackScreen from '@components/BackScreen'
import TextTransform from '@components/TextTransform'
import { getSecureAccount } from '@config/storage/secureStorage'
import RevealWords from '@components/RevealWords'
import ScrollBox from '@components/ScrollBox'

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
        backgroundColor="error.200"
        borderRadius="2xl"
        padding="6"
        marginBottom="6"
        marginTop="2"
      >
        <TextTransform
          textAlign="center"
          variant="textMdRegular"
          maxFontSizeMultiplier={1}
          i18nKey="settings.revealWords.subtitle"
          values={{ numWords: mnemonic?.length }}
        />
      </Box>
    )
  }, [mnemonic?.length])

  return (
    <ScrollBox>
      <BackScreen
        flex={1}
        title={
          mnemonic?.length
            ? t('settings.revealWords.title', { numWords: mnemonic.length })
            : ''
        }
        edges={[]}
        padding="0"
        headerTopMargin="6xl"
      >
        <RevealWords
          mnemonic={mnemonic || []}
          ListHeaderComponent={ListHeaderComponent}
          onDone={navigation.goBack}
        />
      </BackScreen>
    </ScrollBox>
  )
}

export default memo(RevealWordsScreen)
