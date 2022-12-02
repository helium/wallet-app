import React, { useCallback, useMemo, useRef, useState } from 'react'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import {
  ScrollView,
  LogBox,
  NativeSyntheticEvent,
  TextInputEndEditingEventData,
} from 'react-native'
import Animated from 'react-native-reanimated'
import { Edge } from 'react-native-safe-area-context'
import 'text-encoding-polyfill'
import { useTranslation } from 'react-i18next'
import { useAsync } from 'react-async-hook'
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'
import useSubmitTxn from '../../graphql/useSubmitTxn'
import {
  CollectableNavigationProp,
  CollectableStackParamList,
} from './collectablesTypes'
import SafeAreaBox from '../../components/SafeAreaBox'
import { DelayedFadeIn } from '../../components/FadeInOut'
import globalStyles from '../../theme/globalStyles'
import Box from '../../components/Box'
import ImageBox from '../../components/ImageBox'
import ButtonPressable from '../../components/ButtonPressable'
import Text from '../../components/Text'
import { ww } from '../../utils/layout'
import BackScreen from '../../components/BackScreen'
import { useSpacing } from '../../theme/themeHooks'
import InfoIcon from '../../assets/images/info.svg'
import TextInput from '../../components/TextInput'
import { solAddressIsValid } from '../../utils/accountUtils'
import Menu from '../../assets/images/menu.svg'
import ListItem from '../../components/ListItem'
import BlurActionSheet from '../../components/BlurActionSheet'
import {
  createTransferCollectableMessage,
  getConnection,
} from '../../utils/solanaUtils'
import { useAppStorage } from '../../storage/AppStorageProvider'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import AddressBookSelector, {
  AddressBookRef,
} from '../../components/AddressBookSelector'
import { CSAccount } from '../../storage/cloudStorage'
import * as Logger from '../../utils/logger'
import TextTransform from '../../components/TextTransform'

LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
])

type Route = RouteProp<CollectableStackParamList, 'TransferCollectableScreen'>

const TransferCollectableScreen = () => {
  const route = useRoute<Route>()
  const navigation = useNavigation<CollectableNavigationProp>()
  const COLLECTABLE_HEIGHT = ww
  const safeEdges = useMemo(() => ['bottom'] as Edge[], [])
  const backEdges = useMemo(() => ['top'] as Edge[], [])

  const { t } = useTranslation()

  const { collectable } = route.params

  const spacing = useSpacing()

  const [recipient, setRecipient] = useState('')
  const [hasError, setHasError] = useState(false)
  const [networkError, setNetworkError] = useState<undefined | string>()
  const [hasInsufficientBalance, setHasInsufficientBalance] = useState<
    undefined | boolean
  >()
  const [optionsOpen, setOptionsOpen] = useState(false)
  const [solFee, setSolFee] = useState<number | undefined>(undefined)
  const { solanaNetwork: cluster } = useAppStorage()
  const { currentAccount } = useAccountStorage()
  const addressBookRef = useRef<AddressBookRef>(null)

  const { submitCollectable } = useSubmitTxn()

  useAsync(async () => {
    if (!currentAccount?.solanaAddress) return

    const connection = getConnection(cluster)
    try {
      const { message } = await createTransferCollectableMessage(
        cluster,
        currentAccount?.solanaAddress,
        currentAccount?.address || '',
        collectable,
        currentAccount?.solanaAddress,
      )

      const response = await connection.getFeeForMessage(
        message,
        'singleGossip',
      )
      setSolFee(response.value / LAMPORTS_PER_SOL)

      const balance = await connection.getBalance(
        new PublicKey(currentAccount?.solanaAddress),
      )
      setHasInsufficientBalance(response.value > balance)
    } catch (error) {
      Logger.error(error)
      setNetworkError((error as Error).message)
    }
  }, [])

  const handleInfoPress = useCallback(() => {
    if (collectable.json) {
      navigation.push('NftMetadataScreen', {
        metadata: collectable.json,
      })
    }
  }, [collectable.json, navigation])

  const handleAddressBookSelected = useCallback(() => {
    setOptionsOpen(false)
    addressBookRef?.current?.showAddressBook({})
  }, [])

  const handleContactSelected = useCallback(
    ({ contact }: { contact: CSAccount; prevAddress?: string }) => {
      if (!contact.solanaAddress) return
      setRecipient(contact.solanaAddress)
      setHasError(false)
    },
    [],
  )

  const backgroundImageUri = useMemo(() => {
    return collectable?.json?.image
  }, [collectable.json])

  const handleEditAddress = useCallback((text?: string) => {
    setRecipient(text || '')
  }, [])

  const handleAddressBlur = useCallback(
    (event?: NativeSyntheticEvent<TextInputEndEditingEventData>) => {
      const text = event?.nativeEvent.text
      setHasError(!solAddressIsValid(text || ''))
    },
    [],
  )

  const handleTransfer = useCallback(async () => {
    try {
      submitCollectable(collectable, recipient)
      navigation.navigate('TransferCompleteScreen', {
        collectable,
      })
    } catch (error) {
      Logger.error(error)
      setNetworkError((error as Error).message)
    }
  }, [collectable, navigation, recipient, submitCollectable])

  const toggleActionSheet = useCallback(
    (open) => () => {
      setOptionsOpen(open)
    },
    [],
  )

  const transferOptions = useCallback(
    () => (
      <>
        <ListItem
          key="selectContact"
          title={t('payment.selectContact')}
          onPress={handleAddressBookSelected}
          selected={false}
        />
      </>
    ),
    [handleAddressBookSelected, t],
  )

  const onTrailingIconButtonPress = useCallback(() => {
    setOptionsOpen(true)
  }, [])

  const showError = useMemo(() => {
    if (hasError) return t('generic.notValidSolanaAddress')
    if (hasInsufficientBalance) return t('generic.insufficientBalance')
    if (networkError) return networkError
  }, [hasError, hasInsufficientBalance, networkError, t])

  if (!collectable.json || !backgroundImageUri) {
    return null
  }

  return (
    <BackScreen
      padding="none"
      title="Hotspot Detail"
      backgroundImageUri={backgroundImageUri}
      edges={backEdges}
      TrailingIcon={InfoIcon}
      onTrailingIconPress={handleInfoPress}
    >
      <Animated.View entering={DelayedFadeIn} style={globalStyles.container}>
        <AddressBookSelector
          ref={addressBookRef}
          onContactSelected={handleContactSelected}
          hideCurrentAccount
        >
          <ScrollView>
            <SafeAreaBox
              edges={safeEdges}
              backgroundColor="transparent"
              flex={1}
              padding="m"
              alignItems="center"
            >
              {collectable.json && (
                <Box
                  shadowColor="black"
                  shadowOpacity={0.4}
                  shadowOffset={{ width: 0, height: 10 }}
                  shadowRadius={10}
                  elevation={12}
                >
                  <ImageBox
                    marginTop="l"
                    backgroundColor="black"
                    height={COLLECTABLE_HEIGHT - spacing.xl * 5}
                    width={COLLECTABLE_HEIGHT - spacing.xl * 5}
                    source={{
                      uri: collectable.json.image,
                      cache: 'force-cache',
                    }}
                    borderRadius="xxl"
                  />
                </Box>
              )}
              <Text
                marginTop="l"
                marginBottom="s"
                marginHorizontal="l"
                textAlign="center"
                variant="h2"
              >
                {collectable.json.name}
              </Text>
              <Text variant="body2" color="grey600" marginBottom="xl">
                {collectable.json.description ||
                  t('collectables.noDescription')}
              </Text>
              <TextInput
                floatingLabel={t('collectablesScreen.transferTo')}
                variant="thickBlur"
                marginBottom="s"
                height={80}
                width="100%"
                textColor="white"
                fontWeight="600"
                fontSize={15}
                TrailingIcon={Menu}
                onTrailingIconPress={onTrailingIconButtonPress}
                textInputProps={{
                  placeholder: t('generic.solanaAddress'),
                  placeholderTextColor: 'white',
                  autoCorrect: false,
                  autoComplete: 'off',
                  onChangeText: handleEditAddress,
                  onEndEditing: handleAddressBlur,
                  value: recipient,
                }}
              />
              {solFee ? (
                <TextTransform
                  marginHorizontal="m"
                  variant="body2"
                  marginBottom="s"
                  color="white"
                  i18nKey="collectablesScreen.transferFee"
                  values={{ amount: solFee }}
                />
              ) : (
                <Text
                  marginHorizontal="m"
                  variant="body2"
                  marginBottom="s"
                  color="secondaryText"
                >
                  {t('generic.calculatingTransactionFee')}
                </Text>
              )}
              <Text
                opacity={
                  hasError || hasInsufficientBalance || networkError ? 100 : 0
                }
                marginHorizontal="m"
                variant="body3"
                marginBottom="l"
                color="red500"
              >
                {showError}
              </Text>
              <Box
                flexDirection="row"
                marginBottom="xl"
                marginTop="m"
                marginHorizontal="xl"
              >
                <ButtonPressable
                  height={65}
                  flexGrow={1}
                  borderRadius="round"
                  backgroundColor="white"
                  backgroundColorOpacity={1}
                  backgroundColorOpacityPressed={0.05}
                  titleColorDisabled="grey600"
                  backgroundColorDisabled="white"
                  backgroundColorDisabledOpacity={0.1}
                  disabled={!solAddressIsValid(recipient)}
                  titleColorPressedOpacity={0.3}
                  title={t('collectablesScreen.transfer')}
                  titleColor="black"
                  onPress={handleTransfer}
                  fontWeight="bold"
                />
              </Box>
            </SafeAreaBox>
          </ScrollView>
          <BlurActionSheet
            title={t('collectablesScreen.transferActions')}
            open={optionsOpen}
            onClose={toggleActionSheet(false)}
          >
            {transferOptions()}
          </BlurActionSheet>
        </AddressBookSelector>
      </Animated.View>
    </BackScreen>
  )
}

export default TransferCollectableScreen
