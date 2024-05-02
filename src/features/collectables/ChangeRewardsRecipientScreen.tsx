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
import { HotspotRewardsRecipients } from '@components/HotspotRewardsRecipients'
import SafeAreaBox from '@components/SafeAreaBox'
import Text from '@components/Text'
import TextInput from '@components/TextInput'
import useSubmitTxn from '@hooks/useSubmitTxn'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { CSAccount } from '@storage/cloudStorage'
import { solAddressIsValid } from '@utils/accountUtils'
import React, { memo, useCallback, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Keyboard,
  KeyboardAvoidingView,
  NativeSyntheticEvent,
  TextInputEndEditingEventData,
  TouchableWithoutFeedback,
} from 'react-native'
import { Edge } from 'react-native-safe-area-context'
import { IOT_LAZY_KEY, MOBILE_LAZY_KEY } from '@utils/constants'
import { PublicKey } from '@solana/web3.js'
import * as Logger from '../../utils/logger'
import {
  CollectableNavigationProp,
  CollectableStackParamList,
} from './collectablesTypes'

type Route = RouteProp<
  CollectableStackParamList,
  'ChangeRewardsRecipientScreen'
>
const ChangeRewardsRecipientScreen = () => {
  const { t } = useTranslation()
  const route = useRoute<Route>()
  const nav = useNavigation<CollectableNavigationProp>()
  const { hotspot } = route.params
  const safeEdges = useMemo(() => ['bottom'] as Edge[], [])
  const backEdges = useMemo(() => ['top'] as Edge[], [])
  const addressBookRef = useRef<AddressBookRef>(null)
  const [recipient, setRecipient] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [updating, setUpdating] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [transactionError, setTransactionError] = useState<string>()
  const { submitUpdateRewardsDestination } = useSubmitTxn()

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

  const handleUpdateRecipient = useCallback(async () => {
    if (!solAddressIsValid(recipient)) {
      setTransactionError('Invalid Solana address')
      return
    }

    try {
      setUpdating(true)
      setTransactionError(undefined)
      await submitUpdateRewardsDestination({
        lazyDistributors: [IOT_LAZY_KEY, MOBILE_LAZY_KEY],
        destination: recipient,
        assetId: hotspot.id,
      })
      nav.goBack()
    } catch (error) {
      setUpdating(false)
      Logger.error(error)
      setTransactionError((error as Error).message)
    }
  }, [recipient, hotspot, setUpdating, nav, submitUpdateRewardsDestination])

  const handleRemoveRecipient = useCallback(async () => {
    try {
      setUpdating(true)
      setTransactionError(undefined)
      await submitUpdateRewardsDestination({
        lazyDistributors: [IOT_LAZY_KEY, MOBILE_LAZY_KEY],
        destination: PublicKey.default.toBase58(),
        assetId: hotspot.id,
      })
      nav.goBack()
    } catch (error) {
      setUpdating(false)
      Logger.error(error)
      setTransactionError((error as Error).message)
    }
  }, [hotspot, setUpdating, nav, submitUpdateRewardsDestination])

  const showError = useMemo(() => {
    if (hasError) return t('generic.notValidSolanaAddress')
    if (transactionError) return transactionError
  }, [hasError, transactionError, t])

  return (
    <ReAnimatedBox flex={1} entering={DelayedFadeIn}>
      <BackScreen
        headerTopMargin="l"
        padding="none"
        title={t('changeRewardsRecipientScreen.title')}
        edges={backEdges}
      >
        <AddressBookSelector
          ref={addressBookRef}
          onContactSelected={handleContactSelected}
          hideCurrentAccount
        >
          <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
              <SafeAreaBox
                edges={safeEdges}
                backgroundColor="transparent"
                flex={1}
                padding="m"
                marginHorizontal="s"
                marginVertical="xs"
              >
                <Box flexGrow={1} justifyContent="center">
                  <Text
                    textAlign="left"
                    variant="subtitle2"
                    adjustsFontSizeToFit
                  >
                    {t('changeRewardsRecipientScreen.title')}
                  </Text>
                  <Text variant="subtitle4" color="secondaryText">
                    {t('changeRewardsRecipientScreen.description')}
                  </Text>
                  <HotspotRewardsRecipients hotspot={hotspot} />
                  <TextInput
                    floatingLabel={`${t(
                      'changeRewardsRecipientScreen.newRecipient',
                    )} ${recipientName}`}
                    variant="regular"
                    marginTop="s"
                    height={80}
                    width="100%"
                    textColor="white"
                    fontSize={15}
                    TrailingIcon={Menu}
                    onTrailingIconPress={handleAddressBookSelected}
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
                </Box>
              </SafeAreaBox>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </AddressBookSelector>
        <Box
          flexDirection="row"
          justifyContent="center"
          alignItems="center"
          minHeight={40}
        >
          {showError && (
            <Text variant="body3Medium" color="red500">
              {showError}
            </Text>
          )}
        </Box>
        <Box
          flexDirection="row"
          paddingHorizontal="m"
          paddingBottom="m"
          justifyContent="center"
          alignItems="center"
        >
          {updating ? (
            <Box padding="lm">
              <CircleLoader loaderSize={24} color="white" />
            </Box>
          ) : (
            <>
              <ButtonPressable
                flex={1}
                fontSize={16}
                borderRadius="round"
                borderWidth={2}
                borderColor="white"
                backgroundColorOpacityPressed={0.7}
                title={updating ? '' : t('generic.remove')}
                titleColor="white"
                titleColorPressed="black"
                onPress={handleRemoveRecipient}
              />
              <Box paddingHorizontal="s" />
              <ButtonPressable
                flex={1}
                fontSize={16}
                borderRadius="round"
                borderWidth={2}
                borderColor="white"
                backgroundColor="white"
                backgroundColorOpacityPressed={0.7}
                backgroundColorDisabled="surfaceSecondary"
                backgroundColorDisabledOpacity={0.9}
                titleColorDisabled="secondaryText"
                title={updating ? '' : t('generic.update')}
                titleColor="black"
                onPress={handleUpdateRecipient}
              />
            </>
          )}
        </Box>
      </BackScreen>
    </ReAnimatedBox>
  )
}

export default memo(ChangeRewardsRecipientScreen)
