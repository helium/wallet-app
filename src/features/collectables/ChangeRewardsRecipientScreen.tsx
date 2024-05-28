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
import IotSymbol from '@assets/images/iotSymbol.svg'
import MobileSymbol from '@assets/images/mobileSymbol.svg'
import SafeAreaBox from '@components/SafeAreaBox'
import Text from '@components/Text'
import TextInput from '@components/TextInput'
import useSubmitTxn from '@hooks/useSubmitTxn'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { CSAccount } from '@storage/cloudStorage'
import { ellipsizeAddress, solAddressIsValid } from '@utils/accountUtils'
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
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import { useColors } from '@theme/themeHooks'
import * as Logger from '../../utils/logger'
import {
  CollectableNavigationProp,
  CollectableStackParamList,
} from './collectablesTypes'
import { Mints } from '../../utils/constants'

type Route = RouteProp<
  CollectableStackParamList,
  'ChangeRewardsRecipientScreen'
>
const ChangeRewardsRecipientScreen = () => {
  const { t } = useTranslation()
  const colors = useColors()
  const route = useRoute<Route>()
  const nav = useNavigation<CollectableNavigationProp>()
  const wallet = useCurrentWallet()
  const { hotspot } = route.params
  const safeEdges = useMemo(() => ['bottom'] as Edge[], [])
  const backEdges = useMemo(() => ['top'] as Edge[], [])
  const addressBookRef = useRef<AddressBookRef>(null)
  const [recipient, setRecipient] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [updating, setUpdating] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [removed, setRemoved] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [transactionError, setTransactionError] = useState<string>()
  const { submitUpdateRewardsDestination } = useSubmitTxn()

  const mobileRecipient = useMemo(
    () => hotspot?.rewardRecipients?.[Mints.MOBILE],
    [hotspot],
  )

  const iotRecipient = useMemo(
    () => hotspot?.rewardRecipients?.[Mints.IOT],
    [hotspot],
  )

  const hasIotRecipient = useMemo(
    () =>
      iotRecipient?.destination &&
      wallet &&
      !new PublicKey(iotRecipient.destination).equals(wallet) &&
      !new PublicKey(iotRecipient.destination).equals(PublicKey.default),
    [iotRecipient, wallet],
  )

  const hasMobileRecipient = useMemo(
    () =>
      mobileRecipient?.destination &&
      wallet &&
      !new PublicKey(mobileRecipient.destination).equals(wallet) &&
      !new PublicKey(mobileRecipient.destination).equals(PublicKey.default),
    [mobileRecipient, wallet],
  )

  const recipientsAreDifferent = useMemo(
    () =>
      iotRecipient?.destination &&
      mobileRecipient?.destination &&
      !new PublicKey(iotRecipient?.destination).equals(
        new PublicKey(mobileRecipient?.destination),
      ),
    [iotRecipient, mobileRecipient],
  )

  const hasRecipients = hasIotRecipient || hasMobileRecipient

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

    setTransactionError(undefined)
    setUpdating(true)
    try {
      await submitUpdateRewardsDestination({
        lazyDistributors: [IOT_LAZY_KEY, MOBILE_LAZY_KEY],
        destination: recipient,
        assetId: hotspot.id,
      })
      setUpdating(false)
      nav.goBack()
    } catch (error) {
      setUpdating(false)
      Logger.error(error)
      setTransactionError((error as Error).message)
    }
  }, [recipient, hotspot, setUpdating, nav, submitUpdateRewardsDestination])

  const handleRemoveRecipient = useCallback(async () => {
    setTransactionError(undefined)
    setRemoving(true)
    try {
      await submitUpdateRewardsDestination({
        lazyDistributors: [IOT_LAZY_KEY, MOBILE_LAZY_KEY],
        destination: PublicKey.default.toBase58(),
        assetId: hotspot.id,
      })
      setRemoving(false)
      setRemoved(true)
    } catch (error) {
      setRemoving(false)
      Logger.error(error)
      setTransactionError((error as Error).message)
    }
  }, [hotspot, setRemoving, setRemoved, submitUpdateRewardsDestination])

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
                  <Box
                    borderRadius="m"
                    backgroundColor="secondary"
                    padding="ms"
                    marginTop="s"
                  >
                    <Text variant="body3">
                      {t('changeRewardsRecipientScreen.blurb')}
                    </Text>
                  </Box>
                  {removed
                    ? null
                    : hasRecipients && (
                        <Box
                          flexDirection="row"
                          justifyContent="space-between"
                          marginTop="s"
                        >
                          {!recipientsAreDifferent ? (
                            <>
                              {(hasIotRecipient || hasMobileRecipient) && (
                                <Box
                                  flex={1}
                                  flexDirection="row"
                                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                  // @ts-ignore
                                  gap={4}
                                >
                                  <Box
                                    flex={1}
                                    flexDirection="row"
                                    padding="s"
                                    backgroundColor="black600"
                                    borderRadius="m"
                                    justifyContent="space-between"
                                    position="relative"
                                  >
                                    <Box
                                      flexDirection="row"
                                      alignItems="center"
                                      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                      // @ts-ignore
                                      gap={8}
                                    >
                                      {hasIotRecipient && (
                                        <IotSymbol
                                          color={colors.iotGreen}
                                          width={20}
                                          height={20}
                                        />
                                      )}
                                      {hasMobileRecipient && (
                                        <MobileSymbol
                                          color={colors.mobileBlue}
                                          width={20}
                                          height={20}
                                        />
                                      )}
                                      <Text variant="body3">Recipient</Text>
                                    </Box>
                                    <Text variant="body2">
                                      {ellipsizeAddress(
                                        new PublicKey(
                                          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-non-null-asserted-optional-chain
                                          iotRecipient?.destination!,
                                        ).toBase58(),
                                      )}
                                    </Text>
                                  </Box>
                                </Box>
                              )}
                            </>
                          ) : (
                            <Box
                              flex={1}
                              marginTop="s"
                              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                              // @ts-ignore
                              gap={4}
                            >
                              {hasIotRecipient && (
                                <Box
                                  flexDirection="row"
                                  padding="s"
                                  backgroundColor="black600"
                                  borderRadius="m"
                                  justifyContent="space-between"
                                  position="relative"
                                >
                                  <Box
                                    flexDirection="row"
                                    alignItems="center"
                                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                    // @ts-ignore
                                    gap={8}
                                  >
                                    <IotSymbol
                                      color={colors.iotGreen}
                                      width={20}
                                      height={20}
                                    />
                                    <Text variant="body3">Recipient</Text>
                                  </Box>
                                  <Text variant="body2">
                                    {ellipsizeAddress(
                                      new PublicKey(
                                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-non-null-asserted-optional-chain
                                        iotRecipient?.destination!,
                                      ).toBase58(),
                                    )}
                                  </Text>
                                </Box>
                              )}
                              {hasMobileRecipient && (
                                <Box
                                  flexDirection="row"
                                  padding="s"
                                  backgroundColor="black600"
                                  borderRadius="m"
                                  justifyContent="space-between"
                                  position="relative"
                                >
                                  <Box
                                    flexDirection="row"
                                    alignItems="center"
                                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                    // @ts-ignore
                                    gap={8}
                                    l
                                  >
                                    <MobileSymbol
                                      color={colors.mobileBlue}
                                      width={20}
                                      height={20}
                                    />
                                    <Text variant="body3">Recipient</Text>
                                  </Box>
                                  <Text variant="body2">
                                    {ellipsizeAddress(
                                      new PublicKey(
                                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-non-null-asserted-optional-chain
                                        mobileRecipient?.destination!,
                                      ).toBase58(),
                                    )}
                                  </Text>
                                </Box>
                              )}
                            </Box>
                          )}
                          <TouchableOpacityBox
                            flexDirection="row"
                            justifyContent="space-between"
                            alignItems="center"
                            borderRadius="m"
                            paddingVertical="sx"
                            marginLeft="s"
                            paddingLeft="s"
                            paddingRight="s"
                            backgroundColor="black600"
                            onPress={handleRemoveRecipient}
                          >
                            {removing ? (
                              <CircleLoader loaderSize={20} color="white" />
                            ) : (
                              <Text variant="body3Medium">
                                {t('generic.remove')}
                              </Text>
                            )}
                          </TouchableOpacityBox>
                        </Box>
                      )}
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
                  <Box
                    borderRadius="m"
                    backgroundColor="secondary"
                    padding="ms"
                    marginVertical="s"
                  >
                    <Text variant="body3Medium" color="flamenco">
                      {t('changeRewardsRecipientScreen.warning')}
                    </Text>
                  </Box>
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
            title={updating ? '' : t('changeRewardsRecipientScreen.submit')}
            titleColor="black"
            onPress={removing || updating ? () => {} : handleUpdateRecipient}
            TrailingComponent={
              updating ? (
                <CircleLoader loaderSize={20} color="black" />
              ) : undefined
            }
          />
        </Box>
      </BackScreen>
    </ReAnimatedBox>
  )
}

export default memo(ChangeRewardsRecipientScreen)
