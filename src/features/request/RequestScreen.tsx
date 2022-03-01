import React, { memo, useCallback, useMemo, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigation } from '@react-navigation/native'
import {
  Keyboard,
  LayoutChangeEvent,
  StyleSheet,
  Share,
  ActivityIndicator,
} from 'react-native'
import Clipboard from '@react-native-community/clipboard'
import Toast from 'react-native-simple-toast'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import QRCode from 'react-qr-code'
import ShareIcon from '@assets/images/share.svg'
import { useDebounce } from 'use-debounce'
import { useKeyboard } from '@react-native-community/hooks'
import Text from '../../components/Text'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import SafeAreaBox, {
  useModalSafeAreaEdges,
} from '../../components/SafeAreaBox'
import Box from '../../components/Box'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import MemoInput, { useMemoValid } from '../../components/MemoInput'
import {
  useHNTKeyboardSelector,
  withHNTKeyboardProvider,
} from '../../components/HNTKeyboard'
import { useColors, useOpacity, useSpacing } from '../../theme/themeHooks'
import { decimalSeparator, groupSeparator } from '../../utils/i18n'
import { balanceToString, useBalance } from '../../utils/Balance'
import AccountButton from '../../components/AccountButton'
import { useAccountSelector } from '../../components/AccountSelector'
import { makePayRequestLink } from '../../utils/linking'
import useHaptic from '../../utils/useHaptic'
import BackgroundFill from '../../components/BackgroundFill'
import animateTransition from '../../utils/animateTransition'

const QR_CONTAINER_SIZE = 220

type RequestType = 'qr' | 'link'
const RequestScreen = () => {
  const [txnMemo, setTxnMemo] = useState('')
  const { valid: memoValid } = useMemoValid(txnMemo)
  const edges = useModalSafeAreaEdges()
  const { currentAccount } = useAccountStorage()
  const { t } = useTranslation()
  const [requestType, setRequestType] = useState<RequestType>('qr')
  const [containerHeight, setContainerHeight] = useState(0)
  const {
    show: showHNTKeyboard,
    value: tokenValue,
    visible: hntKeyboardVisible,
  } = useHNTKeyboardSelector()
  const { colorStyle } = useOpacity('primaryText', 0.3)
  const { floatToBalance } = useBalance()
  const { show: showAccountSelector } = useAccountSelector()
  const { triggerNavHaptic } = useHaptic()
  const navigation = useNavigation()
  const { l } = useSpacing()
  const { secondaryText } = useColors()
  const [isEditing, setIsEditing] = useState(false)
  const { keyboardShown } = useKeyboard()

  const handleRequestTypePress = useCallback(
    (type: RequestType) => () => {
      setRequestType(type)
    },
    [],
  )

  const handleShowPaymentKeyboard = useCallback(() => {
    Keyboard.dismiss()
    showHNTKeyboard({
      payee: currentAccount,
      payer: null,
      containerHeight,
    })
  }, [containerHeight, currentAccount, showHNTKeyboard])

  const handleContainerLayout = useCallback(
    (layout: LayoutChangeEvent) =>
      setContainerHeight(layout.nativeEvent.layout.height),
    [],
  )

  const paymentAmount = useMemo(() => {
    const strippedVal = (tokenValue || '0')
      .replace(groupSeparator, '')
      .replace(decimalSeparator, '.')
    const numberVal = parseFloat(strippedVal)
    return floatToBalance(numberVal)
  }, [floatToBalance, tokenValue])

  const link = useMemo(() => {
    if (!paymentAmount || !currentAccount?.address || !memoValid) return ''

    return makePayRequestLink({
      payee: currentAccount.address,
      memo: txnMemo,
      balanceAmount: paymentAmount,
    })
  }, [currentAccount, paymentAmount, txnMemo, memoValid])

  const [qrLink] = useDebounce(link, 500)

  useEffect(() => {
    const nextEditing = qrLink !== link || keyboardShown || hntKeyboardVisible
    if (nextEditing === isEditing) return

    animateTransition('RequestScreen.Editing')
    setIsEditing(nextEditing)
  }, [hntKeyboardVisible, isEditing, keyboardShown, link, qrLink])

  const showToast = useCallback(() => {
    Toast.show(
      t('request.copied', {
        target: link,
      }),
    )
  }, [link, t])

  const handleShare = useCallback(() => {
    Share.share({
      message: link,
    })
  }, [link])

  const copyLink = useCallback(() => {
    Clipboard.setString(link)
    showToast()
    triggerNavHaptic()
  }, [link, showToast, triggerNavHaptic])

  return (
    <SafeAreaBox
      marginHorizontal="l"
      backgroundColor="primaryBackground"
      flex={1}
      edges={edges}
      onLayout={handleContainerLayout}
    >
      <Text variant="subtitle2" paddingTop="l" textAlign="center">
        {t('request.title')}
      </Text>
      <Box
        flexDirection="row"
        borderRadius="round"
        minHeight={42}
        marginTop="l"
        marginHorizontal="xxxl"
        overflow="hidden"
      >
        <TouchableOpacityBox
          alignItems="center"
          justifyContent="center"
          onPress={handleRequestTypePress('qr')}
          backgroundColor={
            requestType === 'qr' ? 'surfaceContrast' : 'secondary'
          }
          flex={1}
        >
          <Text
            variant="body1"
            color={
              requestType === 'qr' ? 'surfaceContrastText' : 'secondaryText'
            }
          >
            {t('request.qr')}
          </Text>
        </TouchableOpacityBox>
        <Box width={2} />
        <TouchableOpacityBox
          alignItems="center"
          onPress={handleRequestTypePress('link')}
          justifyContent="center"
          backgroundColor={
            requestType === 'link' ? 'surfaceContrast' : 'secondary'
          }
          flex={1}
        >
          <Text
            variant="body1"
            color={
              requestType === 'link' ? 'surfaceContrastText' : 'secondaryText'
            }
          >
            {t('request.link')}
          </Text>
        </TouchableOpacityBox>
      </Box>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.container}
        enableOnAndroid
      >
        <Box flex={1} />
        {requestType === 'link' && (
          <TouchableOpacityBox
            onPress={copyLink}
            backgroundColor="secondary"
            borderRadius="xl"
          >
            <Text
              variant="body1"
              color="greenBright500"
              padding="l"
              numberOfLines={1}
            >
              {link}
            </Text>
          </TouchableOpacityBox>
        )}
        {requestType === 'qr' && !!qrLink && !keyboardShown && (
          <Box
            height={QR_CONTAINER_SIZE}
            aspectRatio={1}
            backgroundColor="secondary"
            padding="l"
            borderRadius="xl"
            alignSelf="center"
            justifyContent="center"
          >
            {!isEditing ? (
              <QRCode size={QR_CONTAINER_SIZE - 2 * l} value={qrLink} />
            ) : (
              <ActivityIndicator color={secondaryText} />
            )}
          </Box>
        )}
        <Box flex={1} />

        <Box
          backgroundColor="secondary"
          flexDirection="column"
          marginBottom="l"
          padding="lm"
          marginTop={keyboardShown ? 'l' : undefined}
          borderRadius="xl"
        >
          <Text variant="body3" color="secondaryText">
            {t('request.payee')}
          </Text>
          <AccountButton
            innerHorizontalPadding="none"
            innerVerticalPadding="xs"
            title={currentAccount?.alias}
            address={currentAccount?.address}
            netType={currentAccount?.netType}
            onPress={showAccountSelector}
          />

          <Box
            height={1}
            backgroundColor="primaryBackground"
            marginVertical="ms"
            marginHorizontal="n_l"
          />

          <TouchableOpacityBox
            justifyContent="center"
            onPress={handleShowPaymentKeyboard}
          >
            <Text variant="body3" color="secondaryText">
              {t('request.amount')}
            </Text>
            {!tokenValue || tokenValue === '0' ? (
              <Text variant="subtitle2" style={colorStyle}>
                {t('request.enterAmount', {
                  ticker: paymentAmount?.type.ticker,
                })}
              </Text>
            ) : (
              <Text variant="subtitle2" color="primaryText">
                {balanceToString(paymentAmount)}
              </Text>
            )}
          </TouchableOpacityBox>

          <Box
            height={1}
            backgroundColor="primaryBackground"
            marginHorizontal="n_l"
            marginVertical="ms"
          />

          <Text variant="body3" color="secondaryText">
            {t('request.memo')}
          </Text>
          <MemoInput value={txnMemo} onChangeText={setTxnMemo} margin="n_m" />
        </Box>
        <Box flexDirection="row" marginTop="l">
          <TouchableOpacityBox
            flex={1}
            minHeight={66}
            justifyContent="center"
            marginEnd="m"
            borderRadius="round"
            onPress={navigation.goBack}
            overflow="hidden"
          >
            <BackgroundFill backgroundColor="error" />
            <Text variant="subtitle1" textAlign="center" color="error">
              {t('generic.cancel')}
            </Text>
          </TouchableOpacityBox>
          <TouchableOpacityBox
            flex={1}
            minHeight={66}
            backgroundColor="secondary"
            justifyContent="center"
            alignItems="center"
            borderRadius="round"
            onPress={handleShare}
            flexDirection="row"
          >
            <ShareIcon color={secondaryText} />
            <Text
              marginLeft="s"
              variant="subtitle1"
              textAlign="center"
              color="secondaryText"
            >
              {t('generic.share')}
            </Text>
          </TouchableOpacityBox>
        </Box>
      </KeyboardAwareScrollView>
    </SafeAreaBox>
  )
}
const styles = StyleSheet.create({
  container: { width: '100%', flex: 1 },
})

export default memo(withHNTKeyboardProvider(RequestScreen))
