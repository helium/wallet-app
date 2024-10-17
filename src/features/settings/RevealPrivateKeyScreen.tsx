import React, { memo, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAsync } from 'react-async-hook'
import Text from '@components/Text'
import Box from '@components/Box'
import BackScreen from '@components/BackScreen'
import TextTransform from '@components/TextTransform'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import CopyAddress from '@components/CopyAddress'
import useAlert from '@hooks/useAlert'
import { bs58 } from '@coral-xyz/anchor/dist/cjs/utils/bytes'
import { getSecureAccount } from '../../storage/secureStorage'
import { useAccountStorage } from '../../storage/AccountStorageProvider'

const RevealPrivateKeyScreen = () => {
  const { currentAccount } = useAccountStorage()
  const { t } = useTranslation()
  const [privateKey, setPrivateKey] = useState<string>()
  const [revealed, setRevealed] = useState(false)
  const { showOKCancelAlert } = useAlert()

  useAsync(async () => {
    // don't remove key from secure store until they press reveal
    if (!revealed) return
    if (!currentAccount?.address) return
    const secureAccount = await getSecureAccount(currentAccount.address)
    if (!secureAccount?.keypair.sk) return
    setPrivateKey(
      bs58.encode(
        Buffer.from(secureAccount?.keypair?.sk, 'base64').toJSON().data,
      ),
    )
  }, [currentAccount?.address, revealed])

  const showConfirmDialog = useCallback(async () => {
    const decision = await showOKCancelAlert({
      title: t('settings.revealPrivateKey.alertTitle'),
      message: t('settings.revealPrivateKey.alertMessage'),
    })
    setRevealed(decision)
  }, [showOKCancelAlert, t])

  return (
    <BackScreen backgroundColor="primaryBackground" flex={1}>
      <Text variant="displayMdRegular" maxFontSizeMultiplier={1} marginTop="8">
        {t('settings.revealPrivateKey.title')}
      </Text>
      <TextTransform
        variant="textMdRegular"
        maxFontSizeMultiplier={1}
        marginTop="4"
        i18nKey="settings.revealPrivateKey.subtitle"
        marginBottom="8"
      />
      {revealed ? (
        <>
          <Box
            marginHorizontal="xs"
            height={140}
            marginVertical="6"
            backgroundColor="primaryText"
            padding="6"
            borderRadius="2xl"
            justifyContent="center"
          >
            <Text
              variant="textSmRegular"
              fontSize={12}
              color="primaryBackground"
              maxFontSizeMultiplier={1}
              selectable
            >
              {privateKey}
            </Text>
          </Box>
          <CopyAddress address={privateKey || ''} />
        </>
      ) : (
        <TouchableOpacityBox
          onPress={showConfirmDialog}
          marginHorizontal="xs"
          height={{ none: 80, sm: 100 }}
          marginVertical="6"
          backgroundColor="primaryText"
          padding="6"
          borderRadius="2xl"
          justifyContent="center"
        >
          <Text
            variant="textSmRegular"
            fontSize={18}
            color="primaryBackground"
            maxFontSizeMultiplier={1}
            textAlign="center"
            fontWeight="bold"
            selectable
          >
            {t('settings.revealPrivateKey.tap')}
          </Text>
        </TouchableOpacityBox>
      )}
      <Box flex={1} />
    </BackScreen>
  )
}

export default memo(RevealPrivateKeyScreen)
