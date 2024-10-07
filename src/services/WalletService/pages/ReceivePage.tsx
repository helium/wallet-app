import Box from '@components/Box'
import Text from '@components/Text'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import { ellipsizeAddress } from '@utils/accountUtils'
import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Image } from 'react-native'
import QRCode from 'react-native-qrcode-svg'
import CarotRight from '@assets/images/carot-right.svg'
import { useColors } from '@theme/themeHooks'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import ScrollBox from '@components/ScrollBox'
import useCopyText from '@hooks/useCopyText'

const ReceivePage = () => {
  const { t } = useTranslation()
  const wallet = useCurrentWallet()
  const colors = useColors()
  const copyText = useCopyText()

  const onCopyAddress = useCallback(() => {
    copyText({
      message: t('generic.toClipboard'),
      copyText: wallet?.toBase58() || '',
    })
  }, [copyText, wallet])

  return (
    <ScrollBox paddingHorizontal={'2xl'} paddingTop="6xl">
      <Box alignItems={'center'} gap="2.5">
        <Image source={require('@assets/images/receive.png')} />
        <Text textAlign={'center'} variant={'displaySmSemibold'}>
          {t('receivePage.title')}
        </Text>
        <Text
          textAlign={'center'}
          variant={'textMdRegular'}
          color="secondaryText"
        >
          {t('receivePage.subtitle')}
        </Text>
      </Box>
      <TouchableOpacityBox
        backgroundColor="cardBackground"
        padding="2xl"
        flexDirection={'row'}
        alignItems={'center'}
        borderRadius={'2xl'}
        marginTop="4xl"
      >
        <Box
          padding="4"
          backgroundColor={'primaryBackground'}
          borderRadius={'2xl'}
          borderWidth={1}
          borderColor={'border.primary'}
        >
          <QRCode
            value="Just some string value"
            logo={require('@assets/images/helium.png')}
            logoSize={40}
            logoMargin={20}
            size={115}
            logoBorderRadius={100}
          />
        </Box>
        <Box flex={1} />
        <Text
          variant={'textMdSemibold'}
          textAlign={'center'}
          marginRight={'2.5'}
        >
          {t('receivePage.shareQr')}
        </Text>
        <CarotRight color={colors['text.quaternary-500']} />
      </TouchableOpacityBox>
      <TouchableOpacityBox
        backgroundColor="cardBackground"
        padding="2xl"
        flexDirection={'row'}
        alignItems={'center'}
        borderRadius={'2xl'}
        marginTop="xxs"
        onPress={onCopyAddress}
      >
        <Text variant="textMdMedium" color="primaryText" opacity={0.4}>
          {ellipsizeAddress(wallet?.toBase58() || '', {
            numChars: 4,
          })}
        </Text>
        <Box flex={1} />
        <Text variant="textMdMedium" color="primaryText" marginRight={'2.5'}>
          {t('receivePage.copyAddress')}
        </Text>
        <CarotRight color={colors['text.quaternary-500']} />
      </TouchableOpacityBox>
    </ScrollBox>
  )
}

export default ReceivePage
