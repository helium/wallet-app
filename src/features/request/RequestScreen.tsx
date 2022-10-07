import React, {
  memo,
  useCallback,
  useMemo,
  useState,
  useEffect,
  useRef,
} from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigation } from '@react-navigation/native'
import {
  Keyboard,
  LayoutChangeEvent,
  ActivityIndicator,
  Platform,
} from 'react-native'
import Share, { ShareOptions } from 'react-native-share'
import Clipboard from '@react-native-community/clipboard'
import Toast from 'react-native-simple-toast'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import ShareIcon from '@assets/images/share.svg'
import { useDebounce } from 'use-debounce'
import { useKeyboard } from '@react-native-community/hooks'
import Balance, { NetworkTokens, TestNetworkTokens } from '@helium/currency'
import { NetTypes as NetType } from '@helium/address'
import QRCode from 'react-native-qrcode-svg'
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated'
import TabBar, { TabBarOption } from '../../components/TabBar'
import Text from '../../components/Text'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import Box from '../../components/Box'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import MemoInput, { useMemoValid } from '../../components/MemoInput'
import {
  useBorderRadii,
  useColors,
  useOpacity,
  useSpacing,
} from '../../theme/themeHooks'
import { balanceToString, useBalance } from '../../utils/Balance'
import AccountButton from '../../components/AccountButton'
import { useAccountSelector } from '../../components/AccountSelector'
import { makePayRequestLink } from '../../utils/linking'
import useHaptic from '../../utils/useHaptic'
import BackgroundFill from '../../components/BackgroundFill'
import animateTransition from '../../utils/animateTransition'
import HNTKeyboard, { HNTKeyboardRef } from '../../components/HNTKeyboard'
import { TokenType } from '../../generated/graphql'
import TokenButton from '../../components/TokenButton'
import TokenSelector, { TokenSelectorRef } from '../../components/TokenSelector'
import FadeInOut from '../../components/FadeInOut'

const QR_CONTAINER_SIZE = 220

type RequestType = 'qr' | 'link'
const RequestScreen = () => {
  const [txnMemo, setTxnMemo] = useState('')
  const { valid: memoValid } = useMemoValid(txnMemo)
  const { currentAccount } = useAccountStorage()
  const { t } = useTranslation()
  const [requestType, setRequestType] = useState<RequestType>('qr')
  const [containerHeight, setContainerHeight] = useState(0)
  const { colorStyle } = useOpacity('primaryText', 0.3)
  const { show: showAccountSelector } = useAccountSelector()
  const { triggerNavHaptic } = useHaptic()
  const navigation = useNavigation()
  const { l } = useSpacing()
  const { l: borderRadius } = useBorderRadii()
  const { secondaryText, primaryText } = useColors()
  const [isEditing, setIsEditing] = useState(false)
  const { keyboardShown } = useKeyboard()
  const hntKeyboardRef = useRef<HNTKeyboardRef>(null)
  const [hntKeyboardVisible, setHNTKeyboardVisible] = useState(false)
  const [paymentAmount, setPaymentAmount] =
    useState<Balance<NetworkTokens | TestNetworkTokens>>()
  const [tokenType, setTokenType] = useState<TokenType>(TokenType.Hnt)
  const tokenSelectorRef = useRef<TokenSelectorRef>(null)
  const qrRef = useRef<{
    toDataURL: (callback: (url: string) => void) => void
  }>(null)

  const { currencyTypeFromTokenType } = useBalance()

  const handleBalance = useCallback(
    (opts: {
      balance: Balance<NetworkTokens | TestNetworkTokens>
      payee?: string
      index?: number
    }) => {
      setPaymentAmount(opts.balance)
    },
    [setPaymentAmount],
  )

  const handleRequestTypePress = useCallback((type: string) => {
    setRequestType(type as RequestType)
  }, [])

  const handleShowPaymentKeyboard = useCallback(() => {
    Keyboard.dismiss()
    hntKeyboardRef.current?.show({
      payee: currentAccount,
      payer: null,
      containerHeight,
      balance: paymentAmount,
    })
  }, [containerHeight, currentAccount, paymentAmount])

  const handleContainerLayout = useCallback(
    (layout: LayoutChangeEvent) =>
      setContainerHeight(layout.nativeEvent.layout.height),
    [],
  )

  const link = useMemo(() => {
    if (!currentAccount?.address || !memoValid) return ''

    return makePayRequestLink({
      payee: currentAccount.address,
      memo: txnMemo,
      balanceAmount: paymentAmount,
      defaultTokenType: tokenType,
    })
  }, [currentAccount, memoValid, paymentAmount, tokenType, txnMemo])

  const [qrLink] = useDebounce(link, 500)

  const qrStyle = useAnimatedStyle(() => {
    const opac = requestType === 'qr' && !!qrLink && !keyboardShown ? 1 : 0
    const animVal = withTiming(opac, { duration: 300 })
    return {
      opacity: animVal,
      position: 'absolute',
      height: QR_CONTAINER_SIZE,
      justifyContent: 'center',
      alignSelf: 'center',
      backgroundColor: primaryText,
      aspectRatio: 1,
      padding: l,
      borderRadius,
    }
  }, [requestType, qrLink, keyboardShown])

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

  const handleShare = useCallback(async () => {
    qrRef.current?.toDataURL((imgData) => {
      const imageUrl = `data:image/png;base64,${imgData}`

      let options: ShareOptions = {
        failOnCancel: false,
        title: 'image',
        message: link,
        url: imageUrl,
        type: 'image/png',
      }

      if (Platform.OS === 'ios') {
        options = {
          failOnCancel: false,
          message: link,
          url: imageUrl,
          type: 'image/png',
          activityItemSources: [
            {
              item: {},
              placeholderItem: { type: 'text', content: link },
              linkMetadata: {
                title: link,
              },
            },
          ],
        }
      }
      Share.open(options)
    })
  }, [link])

  const copyLink = useCallback(() => {
    Clipboard.setString(link)
    showToast()
    triggerNavHaptic()
  }, [link, showToast, triggerNavHaptic])

  const currencyType = useMemo(
    () => currencyTypeFromTokenType(tokenType),
    [currencyTypeFromTokenType, tokenType],
  )

  const requestTypeOptions = useMemo(
    (): Array<TabBarOption> => [
      { title: t('request.qr'), value: 'qr' },
      { title: t('request.link'), value: 'link' },
    ],
    [t],
  )

  const handleTokenTypeSelected = useCallback(() => {
    tokenSelectorRef?.current?.showTokens()
  }, [])

  const onTokenSelected = useCallback((token: TokenType) => {
    setTokenType(token)
  }, [])

  return (
    <HNTKeyboard
      tokenType={TokenType.Hnt}
      ref={hntKeyboardRef}
      onConfirmBalance={handleBalance}
      handleVisible={setHNTKeyboardVisible}
    >
      <TokenSelector ref={tokenSelectorRef} onTokenSelected={onTokenSelected}>
        <Box
          backgroundColor="secondaryBackground"
          flex={1}
          onLayout={handleContainerLayout}
          borderWidth={1}
          borderTopStartRadius="xxl"
          borderTopEndRadius="xxl"
        >
          <Text variant="subtitle2" paddingTop="l" textAlign="center">
            {t('request.title')}
          </Text>
          <TabBar
            tabBarOptions={requestTypeOptions}
            selectedValue={requestType}
            onItemSelected={handleRequestTypePress}
            marginVertical="l"
          />
          <KeyboardAwareScrollView enableOnAndroid>
            <Box marginHorizontal="l">
              <Box
                height={QR_CONTAINER_SIZE}
                alignItems="center"
                justifyContent="center"
              >
                <Animated.View style={qrStyle}>
                  {!isEditing ? (
                    <QRCode
                      size={QR_CONTAINER_SIZE - 2 * l}
                      value={qrLink}
                      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                      // @ts-ignore
                      getRef={qrRef}
                    />
                  ) : (
                    <ActivityIndicator color={secondaryText} />
                  )}
                </Animated.View>

                {requestType === 'link' && (
                  <FadeInOut>
                    <TouchableOpacityBox
                      onPress={copyLink}
                      borderRadius="xl"
                      justifyContent="center"
                    >
                      <Text variant="body1" color="greenBright500" padding="l">
                        {link}
                      </Text>
                    </TouchableOpacityBox>
                  </FadeInOut>
                )}
              </Box>

              <AccountButton
                accountIconSize={41}
                backgroundColor="secondary"
                showBubbleArrow
                marginTop="l"
                title={currentAccount?.alias}
                address={currentAccount?.address}
                netType={currentAccount?.netType}
                onPress={showAccountSelector}
              />
              <TokenButton
                title={t('request.requestType', {
                  ticker: currencyType.ticker,
                })}
                backgroundColor="secondary"
                address={currentAccount?.address}
                netType={currentAccount?.netType}
                onPress={handleTokenTypeSelected}
                showBubbleArrow
                tokenType={tokenType}
              />
              <Box
                backgroundColor={
                  currentAccount?.netType === NetType.TESTNET
                    ? 'lividBrown'
                    : 'secondary'
                }
                flexDirection="column"
                marginBottom="l"
                padding="lm"
                marginTop={keyboardShown ? 'l' : undefined}
                borderRadius="xl"
              >
                <TouchableOpacityBox
                  justifyContent="center"
                  onPress={handleShowPaymentKeyboard}
                >
                  <Text variant="body3" color="primaryText">
                    {t('request.amount')}
                  </Text>
                  {!paymentAmount || paymentAmount.integerBalance === 0 ? (
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

                <Text variant="body3" color="primaryText">
                  {t('request.memo')}
                </Text>
                <MemoInput
                  value={txnMemo}
                  onChangeText={setTxnMemo}
                  margin="n_m"
                />
              </Box>
              <Box flexDirection="row" marginTop="l" paddingBottom="xxl">
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
            </Box>
          </KeyboardAwareScrollView>
        </Box>
      </TokenSelector>
    </HNTKeyboard>
  )
}

export default memo(RequestScreen)
