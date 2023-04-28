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
import Balance, {
  CurrencyType,
  MobileTokens,
  NetworkTokens,
  TestNetworkTokens,
  Ticker,
} from '@helium/currency'
import { NetTypes as NetType } from '@helium/address'
import QRCode from 'react-native-qrcode-svg'
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated'
import TabBar, { TabBarOption } from '@components/TabBar'
import Text from '@components/Text'
import { useAccountStorage } from '@storage/AccountStorageProvider'
import Box from '@components/Box'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { useMemoValid } from '@components/MemoInput'
import {
  useBorderRadii,
  useColors,
  useOpacity,
  useSpacing,
} from '@theme/themeHooks'
import { balanceToString } from '@utils/Balance'
import AccountButton from '@components/AccountButton'
import AccountSelector, {
  AccountSelectorRef,
} from '@components/AccountSelector'
import { makePayRequestLink } from '@utils/linking'
import useHaptic from '@hooks/useHaptic'
import BackgroundFill from '@components/BackgroundFill'
import animateTransition from '@utils/animateTransition'
import HNTKeyboard, { HNTKeyboardRef } from '@components/HNTKeyboard'
import TokenButton from '@components/TokenButton'
import TokenSelector, {
  TokenListItem,
  TokenSelectorRef,
} from '@components/TokenSelector'
import FadeInOut from '@components/FadeInOut'
import TokenIOT from '@assets/images/tokenIOT.svg'
import TokenHNT from '@assets/images/tokenHNT.svg'
import TokenMOBILE from '@assets/images/tokenMOBILE.svg'

const QR_CONTAINER_SIZE = 220

type RequestType = 'qr' | 'link'
const RequestScreen = () => {
  const [txnMemo] = useState('')
  const { valid: memoValid } = useMemoValid(txnMemo)
  const { currentAccount, currentNetworkAddress: networkAddress } =
    useAccountStorage()
  const { t } = useTranslation()
  const [requestType, setRequestType] = useState<RequestType>('qr')
  const [containerHeight, setContainerHeight] = useState(0)
  const { colorStyle } = useOpacity('primaryText', 0.3)
  const accountSelectorRef = useRef<AccountSelectorRef>(null)
  const { triggerNavHaptic } = useHaptic()
  const navigation = useNavigation()
  const { l } = useSpacing()
  const { l: borderRadius } = useBorderRadii()
  const { secondaryText, primaryText, white, blueBright500 } = useColors()
  const [isEditing, setIsEditing] = useState(false)
  const { keyboardShown } = useKeyboard()
  const hntKeyboardRef = useRef<HNTKeyboardRef>(null)
  const [hntKeyboardVisible, setHNTKeyboardVisible] = useState(false)
  const [paymentAmount, setPaymentAmount] =
    useState<Balance<NetworkTokens | TestNetworkTokens | MobileTokens>>()
  const [ticker, setTicker] = useState<Ticker>('HNT')
  const tokenSelectorRef = useRef<TokenSelectorRef>(null)
  const qrRef = useRef<{
    toDataURL: (callback: (url: string) => void) => void
  }>(null)

  const handleBalance = useCallback(
    (opts: {
      balance: Balance<NetworkTokens | TestNetworkTokens | MobileTokens>
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
    if (!networkAddress || !memoValid) return ''

    return makePayRequestLink({
      payee: networkAddress,
      memo: txnMemo,
      balanceAmount: paymentAmount,
      defaultTokenType: ticker,
    })
  }, [memoValid, networkAddress, paymentAmount, ticker, txnMemo])

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

  const currencyType = useMemo(() => CurrencyType.fromTicker(ticker), [ticker])

  const requestTypeOptions = useMemo(
    (): Array<TabBarOption> => [
      { title: t('request.qr'), value: 'qr' },
      { title: t('request.link'), value: 'link' },
    ],
    [t],
  )

  const handleTickerSelected = useCallback(() => {
    tokenSelectorRef?.current?.showTokens()
  }, [])

  const onTickerSelected = useCallback((tick: Ticker) => {
    setTicker(tick)
  }, [])

  const handleAccountButtonPress = useCallback(() => {
    if (!accountSelectorRef?.current) return
    accountSelectorRef?.current?.show()
  }, [])

  const data = useMemo((): TokenListItem[] => {
    const tokens = [
      {
        label: 'HNT',
        icon: <TokenHNT width={30} height={30} color={white} />,
        value: 'HNT' as Ticker,
        selected: ticker === 'HNT',
      },
      {
        label: 'MOBILE',
        icon: <TokenMOBILE width={30} height={30} color={blueBright500} />,
        value: 'MOBILE' as Ticker,
        selected: ticker === 'MOBILE',
      },
      {
        label: 'IOT',
        icon: <TokenIOT width={30} height={30} />,
        value: 'IOT' as Ticker,
        selected: ticker === 'IOT',
      },
    ]

    return tokens
  }, [blueBright500, white, ticker])

  return (
    <HNTKeyboard
      ticker={ticker}
      ref={hntKeyboardRef}
      onConfirmBalance={handleBalance}
      handleVisible={setHNTKeyboardVisible}
    >
      <AccountSelector ref={accountSelectorRef}>
        <TokenSelector
          ref={tokenSelectorRef}
          onTokenSelected={onTickerSelected}
          tokenData={data}
        >
          <Box
            backgroundColor="secondaryBackground"
            flex={1}
            onLayout={handleContainerLayout}
            borderWidth={1}
            borderTopStartRadius="xl"
            borderTopEndRadius="xl"
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
                        <Text
                          variant="body1"
                          color="greenBright500"
                          padding="l"
                        >
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
                  onPress={handleAccountButtonPress}
                />
                <TokenButton
                  title={t('request.requestType', {
                    ticker: currencyType.ticker,
                  })}
                  backgroundColor="secondary"
                  address={currentAccount?.address}
                  onPress={handleTickerSelected}
                  showBubbleArrow
                  ticker={ticker}
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
      </AccountSelector>
    </HNTKeyboard>
  )
}

export default memo(RequestScreen)
