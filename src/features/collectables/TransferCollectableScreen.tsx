import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@ui/Button'
import { buttonTextVariants } from '@ui/buttonVariants'
import { Input } from '@ui/Input'
import { PressableScale } from '@ui/PressableScale'
import { Spinner } from '@ui/Spinner'
import { Text } from '@ui/Text'
import { twMerge } from '@ui/twMerge'
import { BlurView } from 'expo-blur'
import { ChevronRight, Info, Menu } from 'lucide-react-native'
import React, { useRef, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import {
  Image,
  KeyboardAvoidingView,
  LogBox,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  TextInputEndEditingEventData,
  View,
} from 'react-native'
import Animated from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import 'text-encoding-polyfill'
import { withUniwind } from 'uniwind'
import useSubmitTxn from '../../hooks/useSubmitTxn'
import { useSolana } from '../../solana/SolanaProvider'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { CSAccount } from '../../storage/cloudStorage'
import { Collectable, CompressedNFT } from '../../types/solana'
import { solAddressIsValid } from '../../utils/accountUtils'
import { useContentWidth } from '../../utils/layout'
import * as Logger from '../../utils/logger'
import AddressBookSelector, {
  AddressBookRef,
} from '../addressBook/AddressBookSelector'
import BackHeader from './components/BackHeader'
import {
  CollectableNavigationProp,
  CollectableStackParamList,
} from './collectablesTypes'
import { transferCollectableFeeQuery } from './transferCollectableFeeQuery'

LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
])

const SafeArea = withUniwind(SafeAreaView)
const Blur = withUniwind(BlurView)
const KeyboardAvoiding = withUniwind(KeyboardAvoidingView)
const InfoIcon = withUniwind(Info)
const MenuIcon = withUniwind(Menu)
const NextIcon = withUniwind(ChevronRight)

type Route = RouteProp<CollectableStackParamList, 'TransferCollectableScreen'>

const TransferCollectableScreen = () => {
  const route = useRoute<Route>()
  const navigation = useNavigation<CollectableNavigationProp>()
  const COLLECTABLE_HEIGHT = useContentWidth()

  const { t } = useTranslation()

  const { collectable } = route.params

  const [recipient, setRecipient] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [hasError, setHasError] = useState(false)
  const [transferError, setTransferError] = useState<undefined | string>()
  const { currentAccount } = useAccountStorage()
  const { anchorProvider } = useSolana()
  const addressBookRef = useRef<AddressBookRef>(null)
  const [transferring, setTransferring] = useState(false)

  const compressedNFT = collectable as CompressedNFT
  const nft = collectable as Collectable

  const metadata = compressedNFT?.content?.metadata || nft?.json

  const imageSize = COLLECTABLE_HEIGHT - 160

  const { submitCollectable } = useSubmitTxn()

  const { data: feeData, error: feeError } = useQuery(
    transferCollectableFeeQuery({
      anchorProvider,
      solanaAddress: currentAccount?.solanaAddress,
      heliumAddress: currentAccount?.address || '',
      collectable,
    }),
  )
  const solFee = feeData ? feeData.feeLamports / LAMPORTS_PER_SOL : undefined
  const hasInsufficientBalance = feeData
    ? feeData.feeLamports > feeData.balanceLamports
    : undefined
  const networkError = transferError || feeError?.message

  const handleInfoPress = () => {
    if (metadata) {
      navigation.push('NftMetadataScreen', {
        metadata,
      })
    }
  }

  const handleAddressBookSelected = () => {
    addressBookRef?.current?.showAddressBook({})
  }

  const handleContactSelected = ({
    contact,
  }: {
    contact: CSAccount
    prevAddress?: string
  }) => {
    if (!contact.solanaAddress) return
    setRecipient(contact.solanaAddress)
    setRecipientName(contact.alias)
    setHasError(false)
  }

  const backgroundImageUri = metadata.image

  const handleEditAddress = (text?: string) => {
    setRecipient(text || '')
    setRecipientName('')
  }

  const handleAddressBlur = (
    event?: NativeSyntheticEvent<TextInputEndEditingEventData>,
  ) => {
    const text = event?.nativeEvent.text
    setHasError(!solAddressIsValid(text || ''))
  }

  const handleTransfer = async () => {
    setTransferring(true)
    try {
      const batchId = await submitCollectable(collectable, recipient)
      setTransferring(false)
      navigation.navigate('TransferCompleteScreen', {
        collectable,
        batchId,
      })
    } catch (error) {
      setTransferring(false)
      Logger.error(error)
      setTransferError((error as Error).message)
    }
  }

  const showError = (() => {
    if (hasError) return t('generic.notValidSolanaAddress')
    if (hasInsufficientBalance) return t('generic.insufficientBalance')
    if (networkError) return networkError
  })()

  return (
    <Animated.View className="flex-1 bg-background">
      {/* The blurred NFT image fills the screen behind the content. */}
      {backgroundImageUri && (
        <>
          <Image
            className="absolute inset-0 opacity-70"
            source={{ uri: backgroundImageUri, cache: 'force-cache' }}
            resizeMode="cover"
          />
          <Blur
            className="absolute inset-0"
            intensity={Platform.OS === 'android' ? 15 : 5}
          />
        </>
      )}
      <SafeArea edges={['top']} className="flex-1">
        <View className="mt-6">
          <BackHeader title={t('collectablesScreen.transferCollectable')} />
          <PressableScale
            onPress={handleInfoPress}
            hitSlop={24}
            feedback="opacity"
            accessibilityLabel={t('collectablesScreen.metadata')}
            className="absolute bottom-0 right-6 top-0 justify-center"
          >
            <InfoIcon size={24} colorClassName="accent-foreground" />
          </PressableScale>
        </View>
        <AddressBookSelector
          ref={addressBookRef}
          onContactSelected={handleContactSelected}
          hideCurrentAccount
        >
          <KeyboardAvoiding
            className="flex-1 flex-col justify-center"
            behavior="padding"
            enabled
            keyboardVerticalOffset={100}
          >
            <ScrollView contentInsetAdjustmentBehavior="automatic">
              <SafeArea edges={['bottom']} className="flex-1 items-center p-4">
                {metadata && (
                  <View className="shadow-lg">
                    <Image
                      className={twMerge(
                        'mt-6 rounded-[35px]',
                        metadata.image ? 'bg-primary' : 'bg-secondary',
                      )}
                      style={{ height: imageSize, width: imageSize }}
                      source={{
                        uri: metadata?.image,
                        cache: 'force-cache',
                      }}
                    />
                  </View>
                )}
                <Text
                  size="4xl"
                  className="mx-6 mb-2 mt-6 text-center font-medium"
                >
                  {metadata.name}
                </Text>
                <Text
                  size="xs"
                  className="mb-8 font-medium text-muted-foreground"
                >
                  {metadata.description ||
                    t('collectablesScreen.collectables.noDescription')}
                </Text>
                <View className="mb-2 w-full">
                  <Text className="mb-2 px-5 font-medium text-muted-foreground">
                    {`${t('collectablesScreen.transferTo')} ${recipientName}`}
                  </Text>
                  <View className="flex-row items-center">
                    <Input
                      variant="form"
                      className="flex-1 pr-12"
                      placeholder={t('generic.solanaAddress')}
                      autoCorrect={false}
                      autoComplete="off"
                      autoCapitalize="none"
                      onChangeText={handleEditAddress}
                      onEndEditing={handleAddressBlur}
                      value={recipient}
                    />
                    <PressableScale
                      onPress={handleAddressBookSelected}
                      hitSlop={16}
                      feedback="opacity"
                      accessibilityLabel={t('collectablesScreen.transferTo')}
                      className="absolute right-4"
                    >
                      <MenuIcon size={20} colorClassName="accent-foreground" />
                    </PressableScale>
                  </View>
                </View>
                {solFee ? (
                  <Text size="xs" className="mx-4 mb-2 font-medium">
                    <Trans
                      i18nKey="collectablesScreen.transferFee"
                      values={{ amount: solFee }}
                      components={{
                        b: <Text size="xs" className="font-bold" />,
                        secondaryText: (
                          <Text size="xs" className="text-muted-foreground" />
                        ),
                      }}
                    />
                  </Text>
                ) : (
                  <Text
                    size="xs"
                    className="mx-4 mb-2 font-medium text-muted-foreground"
                  >
                    {t('generic.calculatingTransactionFee')}
                  </Text>
                )}
                <Text
                  size="xs"
                  className={twMerge(
                    'mx-4 mb-6 font-medium text-destructive',
                    !(hasError || hasInsufficientBalance || networkError) &&
                      'opacity-0',
                  )}
                >
                  {showError}
                </Text>
                <View className="mx-8 mt-4 flex-row">
                  <Button
                    variant="cta"
                    size="lg"
                    className="flex-1"
                    disabled={!solAddressIsValid(recipient) || transferring}
                    onPress={() => void handleTransfer().catch(console.error)}
                  >
                    {transferring ? (
                      <Spinner size="small" colorClassName="accent-white" />
                    ) : (
                      <>
                        <Text
                          className={buttonTextVariants({ variant: 'cta' })}
                        >
                          {t('collectablesScreen.transfer')}
                        </Text>
                        <NextIcon size={16} colorClassName="accent-white" />
                      </>
                    )}
                  </Button>
                </View>
              </SafeArea>
            </ScrollView>
          </KeyboardAvoiding>
        </AddressBookSelector>
      </SafeArea>
    </Animated.View>
  )
}

export default TransferCollectableScreen
