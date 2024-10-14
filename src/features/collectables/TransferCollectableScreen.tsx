import ArrowRight from '@assets/images/arrowRight.svg'
import Menu from '@assets/images/menu.svg'
import AddressBookSelector, {
  AddressBookRef,
} from '@components/AddressBookSelector'
import { ReAnimatedBox } from '@components/AnimatedBox'
import BackScreen from '@components/BackScreen'
import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import CircleLoader from '@components/CircleLoader'
import { DelayedFadeIn } from '@components/FadeInOut'
import ImageBox from '@components/ImageBox'
import Text from '@components/Text'
import TextInput from '@components/TextInput'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { useColors, useSpacing } from '@theme/themeHooks'
import React, { memo, useCallback, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  KeyboardAvoidingView,
  LogBox,
  NativeSyntheticEvent,
  ScrollView,
  TextInputEndEditingEventData,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import 'text-encoding-polyfill'
import ScrollBox from '@components/ScrollBox'
import { Asset } from '@helium/spl-utils'
import { NavBarHeight } from '@components/ServiceNavBar'
import useSubmitTxn from '../../hooks/useSubmitTxn'
import { CSAccount } from '../../storage/cloudStorage'
import { solAddressIsValid } from '../../utils/accountUtils'
import { ww } from '../../utils/layout'
import * as Logger from '../../utils/logger'
import {
  CollectableNavigationProp,
  CollectableStackParamList,
} from './collectablesTypes'

LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
])

type Route = RouteProp<CollectableStackParamList, 'TransferCollectableScreen'>

const TransferCollectableScreen = () => {
  const route = useRoute<Route>()
  const navigation = useNavigation<CollectableNavigationProp>()
  const COLLECTABLE_HEIGHT = ww
  const { bottom } = useSafeAreaInsets()
  const { t } = useTranslation()

  const { collectable } = route.params

  const spacing = useSpacing()

  const [recipient, setRecipient] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [hasError, setHasError] = useState(false)
  const [networkError, setNetworkError] = useState<undefined | string>()
  const addressBookRef = useRef<AddressBookRef>(null)
  const colors = useColors()
  const [transferring, setTransferring] = useState(false)

  const nft = useMemo(() => collectable as Asset, [collectable])

  const image = useMemo(() => {
    return nft?.content?.files?.[0]?.uri
  }, [nft])

  const metadata = useMemo(() => {
    return nft?.content?.metadata
  }, [nft])

  const { submitCollectable } = useSubmitTxn()

  const handleAddressBookSelected = useCallback(() => {
    addressBookRef?.current?.showAddressBook({})
  }, [])

  const handleContactSelected = useCallback(
    ({ contact }: { contact: CSAccount; prevAddress?: string }) => {
      if (!contact.solanaAddress) return
      setRecipient(contact.solanaAddress)
      setRecipientName(contact.alias)
      setHasError(false)
    },
    [],
  )

  const backgroundImageUri = useMemo(() => {
    return metadata.image
  }, [metadata])

  const handleEditAddress = useCallback((text?: string) => {
    setRecipient(text || '')
    setRecipientName('')
  }, [])

  const handleAddressBlur = useCallback(
    (event?: NativeSyntheticEvent<TextInputEndEditingEventData>) => {
      const text = event?.nativeEvent.text
      setHasError(!solAddressIsValid(text || ''))
    },
    [],
  )

  const handleTransfer = useCallback(async () => {
    setTransferring(true)
    try {
      await submitCollectable(collectable, recipient)
      setTransferring(false)
      navigation.navigate('TransferCompleteScreen', {
        collectable,
      })
    } catch (error) {
      setTransferring(false)
      Logger.error(error)
      setNetworkError((error as Error).message)
    }
  }, [collectable, navigation, recipient, submitCollectable])

  const showError = useMemo(() => {
    if (hasError) return t('generic.notValidSolanaAddress')
    if (networkError) return networkError
  }, [hasError, networkError, t])

  return (
    <ReAnimatedBox entering={DelayedFadeIn} flex={1}>
      <ScrollBox>
        <BackScreen
          padding="xl"
          title={t('collectablesScreen.transferCollectable')}
          backgroundImageUri={backgroundImageUri || ''}
          edges={[]}
          headerTopMargin="6xl"
        >
          <KeyboardAvoidingView
            style={{
              flex: 1,
              flexDirection: 'column',
              justifyContent: 'center',
            }}
            behavior="padding"
            enabled
            keyboardVerticalOffset={100}
          >
            <ScrollView>
              <Box
                backgroundColor="transparent"
                flex={1}
                padding="4"
                alignItems="center"
              >
                {metadata && (
                  <Box>
                    <ImageBox
                      marginTop="6"
                      backgroundColor={
                        metadata.image ? 'base.black' : 'bg.tertiary'
                      }
                      height={COLLECTABLE_HEIGHT - spacing.xl * 5}
                      width={COLLECTABLE_HEIGHT - spacing.xl * 5}
                      source={{
                        uri: image,
                        cache: 'force-cache',
                      }}
                      borderRadius="4xl"
                    />
                  </Box>
                )}
                <Text
                  marginTop="6"
                  marginBottom="2"
                  textAlign="center"
                  variant="displayMdMedium"
                >
                  {metadata.name}
                </Text>
                <Text variant="textXsMedium" color="gray.600" marginBottom="8">
                  {metadata.description ||
                    t('collectablesScreen.collectables.noDescription')}
                </Text>
                <Box
                  backgroundColor="cardBackground"
                  borderRadius="xl"
                  marginBottom="2"
                >
                  <TextInput
                    floatingLabel={`${t(
                      'collectablesScreen.transferTo',
                    )} ${recipientName}`}
                    variant="thickBlur"
                    height={80}
                    width="100%"
                    textColor="primaryText"
                    fontSize={15}
                    TrailingIcon={Menu}
                    onTrailingIconPress={handleAddressBookSelected}
                    textInputProps={{
                      placeholder: t('generic.solanaAddress'),
                      placeholderTextColor: colors.secondaryText,
                      autoCorrect: false,
                      autoComplete: 'off',
                      onChangeText: handleEditAddress,
                      onEndEditing: handleAddressBlur,
                      value: recipient,
                    }}
                  />
                </Box>
                <Text
                  opacity={hasError || networkError ? 100 : 0}
                  marginHorizontal="4"
                  variant="textXsMedium"
                  marginBottom="6"
                  color="error.500"
                >
                  {showError}
                </Text>
                <Box
                  flexDirection="row"
                  marginTop="4"
                  style={{
                    marginBottom: NavBarHeight + bottom,
                  }}
                >
                  <ButtonPressable
                    height={65}
                    flexGrow={1}
                    borderRadius="full"
                    backgroundColor="primaryText"
                    backgroundColorOpacityPressed={0.7}
                    backgroundColorDisabled="fg.disabled"
                    backgroundColorDisabledOpacity={0.5}
                    titleColorDisabled="text.disabled"
                    title={transferring ? '' : t('collectablesScreen.transfer')}
                    disabled={!solAddressIsValid(recipient) || transferring}
                    titleColor="primaryBackground"
                    onPress={handleTransfer}
                    TrailingComponent={
                      transferring ? (
                        <CircleLoader loaderSize={20} color="primaryText" />
                      ) : (
                        <ArrowRight
                          width={16}
                          height={15}
                          color={
                            !solAddressIsValid(recipient)
                              ? colors['text.disabled']
                              : colors.primaryBackground
                          }
                        />
                      )
                    }
                  />
                </Box>
              </Box>
            </ScrollView>
          </KeyboardAvoidingView>
        </BackScreen>
        <AddressBookSelector
          ref={addressBookRef}
          onContactSelected={handleContactSelected}
          hideCurrentAccount
        />
      </ScrollBox>
    </ReAnimatedBox>
  )
}

export default memo(TransferCollectableScreen)
