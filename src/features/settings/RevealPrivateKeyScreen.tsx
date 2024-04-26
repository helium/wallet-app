import React, { memo, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAsync } from 'react-async-hook'
import { useNavigation } from '@react-navigation/native'
import Text from '@components/Text'
import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import BackScreen from '@components/BackScreen'
import TextTransform from '@components/TextTransform'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import CopyAddress from '@components/CopyAddress'
import useAlert from '@hooks/useAlert'
import { getSecureAccount } from '../../storage/secureStorage'
import { useAccountStorage } from '../../storage/AccountStorageProvider'

const RevealPrivateKeyScreen = () => {
  const { currentAccount } = useAccountStorage()
  const { t } = useTranslation()
  const navigation = useNavigation()
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
      JSON.stringify(
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
      <Text variant="h1" maxFontSizeMultiplier={1} marginTop="xl">
        {t('settings.revealPrivateKey.title')}
      </Text>
      <TextTransform
        variant="body1"
        maxFontSizeMultiplier={1}
        marginTop="m"
        i18nKey="settings.revealPrivateKey.subtitle"
        marginBottom="xl"
      />
      {revealed ? (
        <>
          <Box
            marginHorizontal="xs"
            height={140}
            marginVertical="l"
            backgroundColor="grey900"
            padding="l"
            borderRadius="m"
            justifyContent="center"
          >
            <Text
              fontSize={12}
              color="primaryText"
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
          height={{ smallPhone: 80, phone: 100 }}
          marginVertical="l"
          backgroundColor="grey900"
          padding="l"
          borderRadius="m"
          justifyContent="center"
        >
          <Text
            fontSize={18}
            color="primaryText"
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
      <ButtonPressable
        height={60}
        borderRadius="round"
        backgroundColor="surfaceSecondary"
        titleColor="primaryText"
        title={t('settings.revealPrivateKey.done')}
        marginBottom="m"
        onPress={navigation.goBack}
      />
    </BackScreen>
  )
}

export default memo(RevealPrivateKeyScreen)
