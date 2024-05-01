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
import { useEntityKey } from '@hooks/useEntityKey'
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
import * as Logger from '../../utils/logger'
import {
  CollectableNavigationProp,
  CollectableStackParamList,
} from './collectablesTypes'

const BUTTON_HEIGHT = 65
type Route = RouteProp<
  CollectableStackParamList,
  'ChangeRewardsRecipientScreen'
>
const ChangeRewardsRecipientScreen = () => {
  const { t } = useTranslation()
  const route = useRoute<Route>()
  const nav = useNavigation<CollectableNavigationProp>()
  const { hotspot } = route.params
  const entityKey = useEntityKey(hotspot)
  const safeEdges = useMemo(() => ['bottom'] as Edge[], [])
  const backEdges = useMemo(() => ['top'] as Edge[], [])
  const addressBookRef = useRef<AddressBookRef>(null)
  const [recipient, setRecipient] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [updating, setUpdating] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [transactionError, setTransactionError] = useState<string>()
  // const { submitUpdateEntityInfo } = useSubmitTxn()

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

    setUpdating(true)
    setTransactionError(undefined)

    try {
      console.log('Updating rewards recipient')
      nav.goBack()
    } catch (error) {
      setUpdating(false)
      Logger.error(error)
      setTransactionError((error as Error).message)
    }
  }, [recipient, setUpdating, nav])

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
                <Box
                  flexDirection="row"
                  justifyContent="center"
                  alignItems="center"
                  marginVertical="s"
                  minHeight={40}
                >
                  {showError && (
                    <Text variant="body3Medium" color="red500">
                      {showError}
                    </Text>
                  )}
                </Box>
                <Box>
                  <ButtonPressable
                    height={BUTTON_HEIGHT}
                    flexGrow={1}
                    borderRadius="round"
                    backgroundColor="white"
                    backgroundColorOpacityPressed={0.7}
                    backgroundColorDisabled="white"
                    backgroundColorDisabledOpacity={0.0}
                    titleColorDisabled="grey600"
                    title={
                      updating ? '' : t('changeRewardsRecipientScreen.submit')
                    }
                    titleColor="black"
                    onPress={handleUpdateRecipient}
                    TrailingComponent={
                      updating ? (
                        <CircleLoader loaderSize={20} color="black" />
                      ) : undefined
                    }
                  />
                </Box>
              </SafeAreaBox>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </AddressBookSelector>
      </BackScreen>
    </ReAnimatedBox>
  )
}

export default memo(ChangeRewardsRecipientScreen)
