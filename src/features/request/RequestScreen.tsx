import AccountButton from '@components/AccountButton'
import AccountSelector, {
  AccountSelectorRef,
} from '@components/AccountSelector'
import HNTKeyboard, { HNTKeyboardRef } from '@components/HNTKeyboard'
import TabBar, { TabBarOption } from '@components/TabBar'
import TokenButton from '@components/TokenButton'
import TokenSelector, {
  TokenListItem,
  TokenSelectorRef,
} from '@components/TokenSelector'
import { NetTypes as NetType } from '@helium/address'
import { useMint } from '@helium/helium-react-hooks'
import useHaptic from '@hooks/useHaptic'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import Clipboard from '@react-native-clipboard/clipboard'
import { useKeyboard } from '@react-native-community/hooks'
import { useNavigation } from '@react-navigation/native'
import { PublicKey } from '@solana/web3.js'
import { useAccountStorage } from '@storage/AccountStorageProvider'
import { useVisibleTokens } from '@storage/TokensProvider'
import { FADE_IN, FADE_OUT } from '@theme/motion'
import { Button } from '@ui/Button'
import { buttonTextVariants } from '@ui/buttonVariants'
import { Card } from '@ui/Card'
import { PressableScale } from '@ui/PressableScale'
import { Spinner } from '@ui/Spinner'
import { Text } from '@ui/Text'
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
import { Keyboard, LayoutChangeEvent, Platform, View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import QRCode from 'react-native-qrcode-svg'
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import Share, { ShareOptions } from 'react-native-share'
import Toast from 'react-native-simple-toast'
import { useDebounce } from 'use-debounce'
import { Share as ShareGlyph } from 'lucide-react-native'
import { withUniwind } from 'uniwind'

const SafeArea = withUniwind(SafeAreaView)
const ShareIcon = withUniwind(ShareGlyph)

const QR_CONTAINER_SIZE = 220
// `p-6` around the code inside the QR container.
const QR_PADDING = 24

type RequestType = 'qr' | 'link'
const RequestScreen = () => {
  // Opt out: the isEditing effect sets state on purpose, see the
  // set-state-in-effect note above setIsEditing
  'use no memo'

  const { visibleTokens } = useVisibleTokens()
  const { currentAccount, currentNetworkAddress: networkAddress } =
    useAccountStorage()
  const { t } = useTranslation()
  const [requestType, setRequestType] = useState<RequestType>('qr')
  const [containerHeight, setContainerHeight] = useState(0)
  const accountSelectorRef = useRef<AccountSelectorRef>(null)
  const { triggerNavHaptic } = useHaptic()
  const navigation = useNavigation()
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
    const animVal = withTiming(opac, {
      duration: 300,
      reduceMotion: ReduceMotion.Never,
    })
    return { opacity: animVal }
  }, [requestType, qrLink, keyboardShown])

  useEffect(() => {
    const nextEditing = qrLink !== link || keyboardShown || hntKeyboardVisible
    if (nextEditing === isEditing) return

    animateTransition('RequestScreen.Editing')
    // eslint-disable-next-line react-hooks/set-state-in-effect -- LayoutAnimation.configureNext must run after the link/keyboard commit and right before the isEditing commit it animates; deriving isEditing in render would need the native side effect in render
    setIsEditing(nextEditing)
  }, [hntKeyboardVisible, isEditing, keyboardShown, link, qrLink])

  const showToast = useCallback(() => {
    Toast.show(
      t('request.copied', {
        target: link,
      }),
      Toast.SHORT,
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
      void Share.open(options)
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
        <TokenSelector
          ref={tokenSelectorRef}
          onTokenSelected={setMint}
          tokenData={data}
        >
          <SafeArea
            className="flex-1 rounded-t-[20px] border border-border bg-secondary"
            onLayout={handleContainerLayout}
            edges={['top']}
          >
            <Text size="lg" className="pt-6 text-center font-medium">
              {t('request.title')}
            </Text>
            <TabBar
              tabBarOptions={requestTypeOptions}
              selectedValue={requestType}
              onItemSelected={handleRequestTypePress}
              marginVertical="l"
            />
            <KeyboardAwareScrollView
              contentInsetAdjustmentBehavior="automatic"
              bottomOffset={75}
            >
              <View className="mx-6">
                <View className="h-[220px] items-center justify-center">
                  {/* A QR code needs a light quiet zone in both themes. */}
                  <Animated.View
                    style={qrStyle}
                    className="absolute aspect-square h-[220px] justify-center self-center rounded-[12px] bg-white p-6"
                  >
                    {!isEditing ? (
                      <QRCode
                        size={QR_CONTAINER_SIZE - 2 * QR_PADDING}
                        value={qrLink}
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        getRef={qrRef}
                      />
                    ) : (
                      <Spinner colorClassName="accent-muted-foreground" />
                    )}
                  </Animated.View>

                  {requestType === 'link' && (
                    <Animated.View entering={FADE_IN} exiting={FADE_OUT}>
                      <PressableScale
                        onPress={copyLink}
                        feedback="opacity"
                        className="justify-center rounded-[20px]"
                      >
                        <Text size="base" className="p-6 text-success-500">
                          {link}
                        </Text>
                      </PressableScale>
                    </Animated.View>
                  )}
                </View>

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
                    ticker: symbol || '',
                  })}
                  backgroundColor="secondary"
                  address={currentAccount?.address}
                  onPress={handleTickerSelected}
                  showBubbleArrow
                  mint={mint}
                />
                <Card
                  variant="panel"
                  className={`mb-6 rounded-[20px] p-5 ${
                    currentAccount?.netType === NetType.TESTNET
                      ? 'bg-warning-100'
                      : ''
                  } ${keyboardShown ? 'mt-6' : ''}`}
                >
                  <PressableScale
                    feedback="opacity"
                    className="justify-center"
                    onPress={handleShowPaymentKeyboard}
                  >
                    <Text size="xs">{t('request.amount')}</Text>
                    {!paymentAmount || paymentAmount.isZero() ? (
                      <Text
                        size="lg"
                        className="font-medium text-foreground/30"
                      >
                        {t('request.enterAmount', {
                          ticker: symbol,
                        })}
                      </Text>
                    ) : (
                      <Text size="lg" className="font-medium">
                        {humanReadable(paymentAmount, decimals)}
                      </Text>
                    )}
                  </PressableScale>
                </Card>
                <View className="mt-6 flex-row gap-4 pb-12">
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex-1"
                    onPress={navigation.goBack}
                  >
                    {t('generic.cancel')}
                  </Button>
                  <Button
                    variant="secondary"
                    size="lg"
                    className="flex-1"
                    onPress={() => void handleShare().catch(console.error)}
                  >
                    <ShareIcon
                      size={16}
                      colorClassName="accent-secondary-foreground"
                    />
                    <Text
                      className={buttonTextVariants({ variant: 'secondary' })}
                    >
                      {t('generic.share')}
                    </Text>
                  </Button>
                </View>
              </View>
            </KeyboardAwareScrollView>
          </SafeArea>
        </TokenSelector>
      </AccountSelector>
    </HNTKeyboard>
  )
}

export default memo(RequestScreen)
