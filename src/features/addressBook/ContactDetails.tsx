import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import Close from '@assets/images/close.svg'
import {
  KeyboardAvoidingView,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
  TextInput as RNTextInput,
  Platform,
} from 'react-native'
import Address from '@helium/address'
import Checkmark from '@assets/images/checkmark.svg'
import { useKeyboard } from '@react-native-community/hooks'
import Box from '../../components/Box'
import Text from '../../components/Text'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import { useColors, useOpacity, useSpacing } from '../../theme/themeHooks'
import SafeAreaBox from '../../components/SafeAreaBox'
import { HomeNavigationProp } from '../home/homeTypes'
import TextInput from '../../components/TextInput'
import ButtonPressable from '../../components/ButtonPressable'
import AccountIcon from '../../components/AccountIcon'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import {
  AddressBookNavigationProp,
  AddressBookStackParamList,
} from './addressBookTypes'
import { solAddressIsValid, accountNetType } from '../../utils/accountUtils'
import { useAppStorage } from '../../storage/AppStorageProvider'
import AddressExtra from './AddressExtra'
import useAlert from '../../utils/useAlert'
import { CSAccount } from '../../storage/cloudStorage'
import { useIsHotspotOrValidatorQuery } from '../../generated/graphql'
import useNetworkColor from '../../utils/useNetworkColor'

const BUTTON_HEIGHT = 55

type Route = RouteProp<AddressBookStackParamList, 'AddNewContact'>

type Props = {
  action: 'add' | 'edit'
  contact?: CSAccount
}

const ContactDetails = ({ action, contact }: Props) => {
  const { keyboardShown } = useKeyboard()
  const { t } = useTranslation()
  const homeNav = useNavigation<HomeNavigationProp>()
  const addressBookNav = useNavigation<AddressBookNavigationProp>()
  const route = useRoute<Route>()
  const { backgroundStyle } = useOpacity(
    'surfaceSecondary',
    keyboardShown ? 0.85 : 0.4,
  )
  const { addContact, editContact, deleteContact, currentAccount } =
    useAccountStorage()
  const [nickname, setNickname] = useState(contact?.alias || '')
  const [address, setAddress] = useState('')
  const nicknameInput = useRef<RNTextInput | null>(null)
  const { blueBright500, primaryText } = useColors()
  const { scannedAddress, setScannedAddress, l1Network } = useAppStorage()
  const spacing = useSpacing()
  const { showOKCancelAlert } = useAlert()

  const isSolana = useMemo(() => l1Network === 'solana', [l1Network])
  const backgroundColor = useNetworkColor({ netType: currentAccount?.netType })

  useEffect(() => {
    if (route.params?.address) {
      setAddress(route.params.address)
    } else if (isSolana && contact?.solanaAddress) {
      setAddress(contact.solanaAddress)
    } else if (!isSolana && contact?.address) {
      setAddress(contact.address)
    }
  }, [contact, isSolana, route])

  const { error, loading, data } = useIsHotspotOrValidatorQuery({
    variables: {
      address,
    },
    skip: !address || isSolana || !Address.isValid(address),
  })

  const onRequestClose = useCallback(() => {
    homeNav.goBack()
  }, [homeNav])

  const isAddingContact = useMemo(() => action === 'add', [action])
  const isEditingContact = useMemo(() => action === 'edit', [action])

  const handleCreateNewContact = useCallback(() => {
    let heliumAddress = ''
    let solanaAddress = ''

    if (isSolana) {
      solanaAddress = address
    } else {
      heliumAddress = address
    }

    addContact({
      address: heliumAddress,
      solanaAddress,
      alias: nickname,
      netType: accountNetType(address),
    })
    addressBookNav.goBack()
  }, [addContact, address, addressBookNav, isSolana, nickname])

  const handleDeleteContact = useCallback(async () => {
    const decision = await showOKCancelAlert({
      title: t('editContact.deleteConfirmTitle'),
      message: t('editContact.deleteConfirmMessage', { alias: nickname }),
    })
    if (decision) {
      deleteContact(address)
      addressBookNav.goBack()
    }
  }, [address, addressBookNav, deleteContact, nickname, showOKCancelAlert, t])

  const handleSaveNewContact = useCallback(() => {
    if (!contact) return
    editContact(contact.address, {
      address,
      alias: nickname,
      netType: accountNetType(address),
    })
    addressBookNav.goBack()
  }, [contact, editContact, nickname, address, addressBookNav])

  const handleKeydown = useCallback(
    (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
      if (e.nativeEvent.key === 'Enter') {
        nicknameInput.current?.focus()
      }
    },
    [],
  )

  const handleAddressChange = useCallback((text: string) => {
    setAddress(text.trim())
  }, [])

  const handleScanAddress = useCallback(() => {
    addressBookNav.push('ScanAddress')
  }, [addressBookNav])

  useEffect(() => {
    if (!scannedAddress) return

    if (
      (!isSolana && Address.isValid(scannedAddress)) ||
      (isSolana && solAddressIsValid(scannedAddress))
    ) {
      setAddress(scannedAddress)
      setScannedAddress(undefined)
    }
  }, [isSolana, scannedAddress, setScannedAddress])

  const addressIsValid = useMemo(() => {
    if (isSolana) {
      return solAddressIsValid(address)
    }

    return data?.isHotspotOrValidator === false
  }, [data, isSolana, address])

  return (
    <Box flex={1}>
      <Box
        style={{ paddingTop: Platform.OS === 'android' ? 24 : 0 }}
        flexDirection="row"
        alignItems="center"
        backgroundColor={backgroundColor}
      >
        <Box flex={1} />
        <Text variant="subtitle2">
          {isAddingContact ? t('addNewContact.title') : t('editContact.title')}
        </Text>
        <Box flex={1} alignItems="flex-end">
          <TouchableOpacityBox
            onPress={onRequestClose}
            paddingVertical="m"
            paddingHorizontal="xl"
          >
            <Close color={primaryText} height={16} width={16} />
          </TouchableOpacityBox>
        </Box>
      </Box>
      <Box flex={1} alignItems="center" justifyContent="center">
        {addressIsValid && (
          <AccountIcon address={address} size={nickname ? 85 : 122} />
        )}
        {!!nickname && (
          <Text variant="h1" marginTop={addressIsValid ? 'm' : 'none'}>
            {nickname}
          </Text>
        )}
      </Box>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'android' ? undefined : 'position'}
        keyboardVerticalOffset={-spacing.xxxl - BUTTON_HEIGHT}
      >
        <SafeAreaBox
          style={backgroundStyle}
          borderRadius="xl"
          edges={['bottom']}
        >
          <Box
            flexDirection="row"
            marginTop="xl"
            marginBottom="s"
            justifyContent="space-between"
            marginHorizontal="xl"
          >
            <Text variant="body1">
              {t('addNewContact.address.title', {
                network: isSolana ? 'Solana' : 'Helium',
              })}
            </Text>
            <AddressExtra
              onScanPress={handleScanAddress}
              isValidAddress={addressIsValid}
              addressLoading={loading}
            />
          </Box>
          <TextInput
            variant="plain"
            placeholder={t('addNewContact.address.placeholder')}
            onChangeText={handleAddressChange}
            value={address}
            autoCapitalize="none"
            multiline
            returnKeyType="next"
            autoComplete="off"
            autoCorrect={false}
            paddingVertical="xl"
            onKeyPress={handleKeydown}
          />
          <Text
            opacity={error || data?.isHotspotOrValidator ? 100 : 0}
            variant="body2"
            marginHorizontal="xl"
            marginVertical="xs"
            color="red500"
          >
            {error ? t('generic.loadFailed') : t('generic.notValidAddress')}
          </Text>
          <Box
            flexDirection="row"
            justifyContent="space-between"
            marginTop="m"
            marginBottom="s"
            marginHorizontal="xl"
          >
            <Text variant="body1">{t('addNewContact.nickname.title')}</Text>
            {!!nickname && <Checkmark color={blueBright500} />}
          </Box>
          <TextInput
            variant="plain"
            placeholder={t('addNewContact.nickname.placeholder')}
            onChangeText={setNickname}
            value={nickname}
            autoCapitalize="words"
            autoComplete="off"
            returnKeyType="done"
            autoCorrect={false}
            ref={nicknameInput}
          />
          <ButtonPressable
            visible={isAddingContact}
            backgroundColor="blueBright500"
            height={BUTTON_HEIGHT}
            backgroundColorDisabled="plainInputBackground"
            titleColorDisabled="grey400"
            fontSize={19}
            backgroundColorOpacityPressed={0.7}
            borderRadius="round"
            marginTop="xxxl"
            marginHorizontal="xl"
            title={t('addNewContact.addContact')}
            disabled={!addressIsValid || !nickname}
            onPress={handleCreateNewContact}
          />
          <Box
            flexDirection="row"
            justifyContent="center"
            marginTop="xxxl"
            marginHorizontal="xl"
            visible={isEditingContact}
          >
            <ButtonPressable
              flex={1}
              backgroundColor="error"
              height={BUTTON_HEIGHT}
              backgroundColorDisabled="plainInputBackground"
              titleColorDisabled="grey400"
              fontSize={19}
              backgroundColorOpacity={0.5}
              backgroundColorOpacityPressed={0.3}
              borderRadius="round"
              marginRight="s"
              title={t('editContact.delete')}
              onPress={handleDeleteContact}
            />
            <ButtonPressable
              flex={1}
              backgroundColor="blueBright500"
              height={BUTTON_HEIGHT}
              backgroundColorDisabled="plainInputBackground"
              titleColorDisabled="grey400"
              fontSize={19}
              backgroundColorOpacityPressed={0.7}
              borderRadius="round"
              title={t('editContact.save')}
              marginLeft="s"
              disabled={
                !addressIsValid ||
                !nickname ||
                (nickname === contact?.alias && address === contact?.address)
              }
              onPress={handleSaveNewContact}
            />
          </Box>
        </SafeAreaBox>
      </KeyboardAvoidingView>
    </Box>
  )
}

export default memo(ContactDetails)
