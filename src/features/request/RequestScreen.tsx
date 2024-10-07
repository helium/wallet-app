import ShareIcon from '@assets/images/share.svg'
import AccountButton from '@components/AccountButton'
import AccountSelector, {
  AccountSelectorRef,
} from '@components/AccountSelector'
import BackgroundFill from '@components/BackgroundFill'
import Box from '@components/Box'
import FadeInOut from '@components/FadeInOut'
import HNTKeyboard, { HNTKeyboardRef } from '@components/HNTKeyboard'
import TabBar, { TabBarOption } from '@components/TabBar'
import Text from '@components/Text'
import TokenButton from '@components/TokenButton'
import TokenSelector, {
  TokenListItem,
  TokenSelectorRef,
} from '@components/TokenSelector'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { NetTypes as NetType } from '@helium/address'
import { useMint } from '@helium/helium-react-hooks'
import useHaptic from '@hooks/useHaptic'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import Clipboard from '@react-native-community/clipboard'
import { useKeyboard } from '@react-native-community/hooks'
import { useNavigation } from '@react-navigation/native'
import { PublicKey } from '@solana/web3.js'
import { useAccountStorage } from '@storage/AccountStorageProvider'
import { useVisibleTokens } from '@storage/TokensProvider'
import {
  useBorderRadii,
  useColors,
  useOpacity,
  useSpacing,
} from '@theme/themeHooks'
import animateTransition from '@utils/animateTransition'
import { makePayRequestLink } from '@utils/linking'
import { humanReadable } from '@utils/solanaUtils'
import BN from 'bn.js'
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import {
  ActivityIndicator,
  Keyboard,
  LayoutChangeEvent,
  Platform,
} from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import QRCode from 'react-native-qrcode-svg'
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated'
import Share, { ShareOptions } from 'react-native-share'
import Toast from 'react-native-simple-toast'
import { useDebounce } from 'use-debounce'

const QR_CONTAINER_SIZE = 220

type RequestType = 'qr' | 'link'
const RequestScreen = () => {
  const { visibleTokens } = useVisibleTokens()
  const { currentAccount, currentNetworkAddress: networkAddress } =
    useAccountStorage()
  const { t } = useTranslation()
  const [requestType, setRequestType] = useState<RequestType>('qr')
  const [containerHeight, setContainerHeight] = useState(0)
  const { colorStyle } = useOpacity('primaryText', 0.3)
  const accountSelectorRef = useRef<AccountSelectorRef>(null)
  const { triggerNavHaptic } = useHaptic()
  const navigation = useNavigation()
  const spacing = useSpacing()
  const borderRadii = useBorderRadii()
  const { secondaryText, primaryText } = useColors()
  const [isEditing, setIsEditing] = useState(false)
  const { keyboardShown } = useKeyboard()
  const hntKeyboardRef = useRef<HNTKeyboardRef>(null)
  const [hntKeyboardVisible, setHNTKeyboardVisible] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState<BN>()
  const [mint, setMint] = useState<PublicKey>()
  const tokenSelectorRef = useRef<TokenSelectorRef>(null)
  const qrRef = useRef<{
    toDataURL: (callback: (url: string) => void) => void
  }>(null)
  const decimals = useMint(mint)?.info?.decimals
  const { symbol } = useMetaplexMetadata(mint)

  const handleBalance = useCallback(
    (opts: { balance: BN; payee?: string; index?: number }) => {
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
    if (!networkAddress) return ''

    return makePayRequestLink({
      payee: networkAddress,
      balanceAmount: paymentAmount,
      mint: mint?.toBase58(),
    })
  }, [networkAddress, paymentAmount, mint])

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
      padding: spacing[6],
      borderRadius: borderRadii['2xl'],
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

  const handleAccountButtonPress = useCallback(() => {
    if (!accountSelectorRef?.current) return
    accountSelectorRef?.current?.show()
  }, [])

  const data = useMemo((): TokenListItem[] => {
    return [...visibleTokens].map((m) => {
      return {
        selected: mint?.toBase58() === m,
        mint: new PublicKey(m),
      }
    })
  }, [visibleTokens, mint])

  return (
    <HNTKeyboard
      mint={mint}
      ref={hntKeyboardRef}
      onConfirmBalance={handleBalance}
      handleVisible={setHNTKeyboardVisible}
    >
      <AccountSelector ref={accountSelectorRef}>
        <Box
          backgroundColor="secondaryBackground"
          flex={1}
          onLayout={handleContainerLayout}
          borderWidth={1}
          borderTopStartRadius="4xl"
          borderTopEndRadius="4xl"
        >
          <Text
            variant="textLgMedium"
            paddingTop="6"
            textAlign="center"
            color="primaryText"
          >
            {t('request.title')}
          </Text>
          <TabBar
            tabBarOptions={requestTypeOptions}
            selectedValue={requestType}
            onItemSelected={handleRequestTypePress}
            marginVertical="6"
          />
          <KeyboardAwareScrollView enableOnAndroid>
            <Box marginHorizontal="6">
              <Box
                height={QR_CONTAINER_SIZE}
                alignItems="center"
                justifyContent="center"
              >
                <Animated.View style={qrStyle}>
                  {!isEditing ? (
                    <QRCode
                      size={QR_CONTAINER_SIZE - 2 * spacing[6]}
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
                      borderRadius="4xl"
                      justifyContent="center"
                    >
                      <Text
                        variant="textMdRegular"
                        color="green.light-500"
                        padding="6"
                      >
                        {link}
                      </Text>
                    </TouchableOpacityBox>
                  </FadeInOut>
                )}
              </Box>

              <AccountButton
                accountIconSize={41}
                backgroundColor="secondaryBackground"
                showBubbleArrow
                marginTop="6"
                title={currentAccount?.alias}
                address={currentAccount?.address}
                onPress={handleAccountButtonPress}
              />
              <TokenButton
                title={t('request.requestType', {
                  ticker: symbol || '',
                })}
                backgroundColor="secondaryBackground"
                address={currentAccount?.address}
                onPress={handleTickerSelected}
                showBubbleArrow
                mint={mint}
              />
              <Box
                backgroundColor={
                  currentAccount?.netType === NetType.TESTNET
                    ? 'orange.dark-500'
                    : 'bg.tertiary'
                }
                flexDirection="column"
                marginBottom="6"
                padding="5"
                marginTop={keyboardShown ? '6' : undefined}
                borderRadius="4xl"
              >
                <TouchableOpacityBox
                  justifyContent="center"
                  onPress={handleShowPaymentKeyboard}
                >
                  <Text variant="textXsRegular" color="primaryText">
                    {t('request.amount')}
                  </Text>
                  {!paymentAmount || paymentAmount.isZero() ? (
                    <Text variant="textLgMedium" style={colorStyle}>
                      {t('request.enterAmount', {
                        ticker: symbol,
                      })}
                    </Text>
                  ) : (
                    <Text variant="textLgMedium" color="primaryText">
                      {humanReadable(paymentAmount, decimals)}
                    </Text>
                  )}
                </TouchableOpacityBox>
              </Box>
              <Box flexDirection="row" marginTop="6" paddingBottom="12">
                <TouchableOpacityBox
                  flex={1}
                  minHeight={66}
                  justifyContent="center"
                  marginEnd="4"
                  borderRadius="full"
                  onPress={navigation.goBack}
                  overflow="hidden"
                >
                  <BackgroundFill backgroundColor="error.500" />
                  <Text
                    variant="textXlMedium"
                    textAlign="center"
                    color="error.500"
                  >
                    {t('generic.cancel')}
                  </Text>
                </TouchableOpacityBox>
                <TouchableOpacityBox
                  flex={1}
                  minHeight={66}
                  backgroundColor="secondaryBackground"
                  justifyContent="center"
                  alignItems="center"
                  borderRadius="full"
                  onPress={handleShare}
                  flexDirection="row"
                >
                  <ShareIcon color={secondaryText} />
                  <Text
                    marginLeft="2"
                    variant="textXlMedium"
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
      </AccountSelector>
      <TokenSelector
        ref={tokenSelectorRef}
        onTokenSelected={setMint}
        tokenData={data}
      />
    </HNTKeyboard>
  )
}

export default memo(RequestScreen)
