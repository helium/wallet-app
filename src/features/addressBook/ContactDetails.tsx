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
import {
  KeyboardAvoidingView,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
  TextInput as RNTextInput,
  Platform,
} from 'react-native'
import Checkmark from '@assets/images/checkmark.svg'
import { useKeyboard } from '@react-native-community/hooks'
import Box from '@components/Box'
import Text from '@components/Text'
import { useColors, useOpacity, useSpacing } from '@theme/themeHooks'
import SafeAreaBox from '@components/SafeAreaBox'
import TextInput from '@components/TextInput'
import ButtonPressable from '@components/ButtonPressable'
import AccountIcon from '@components/AccountIcon'
import useAlert from '@hooks/useAlert'
import CloseButton from '@components/CloseButton'
import { solAddressIsValid, accountNetType } from '@utils/accountUtils'
import { heliumAddressFromSolAddress } from '@helium/spl-utils'
import { useDebounce } from 'use-debounce'
import { fetchDomainOwner } from '@utils/getDomainOwner'
import { HomeNavigationProp } from '../home/homeTypes'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import {
  AddressBookNavigationProp,
  AddressBookStackParamList,
} from './addressBookTypes'
import { useAppStorage } from '../../storage/AppStorageProvider'
import AddressExtra from './AddressExtra'
import { CSAccount } from '../../storage/cloudStorage'
import { useSolana } from '../../solana/SolanaProvider'

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
  const { backgroundStyle } = useOpacity('surface', keyboardShown ? 0.85 : 0.4)
  const { addContact, editContact, deleteContact } = useAccountStorage()
  const [nickname, setNickname] = useState(contact?.alias || '')
  const [address, setAddress] = useState('')
  const nicknameInput = useRef<RNTextInput | null>(null)
  const { blueBright500 } = useColors()
  const { scannedAddress, setScannedAddress } = useAppStorage()
  const spacing = useSpacing()
  const { showOKCancelAlert } = useAlert()
  const { connection } = useSolana()
  // debounce is needed to avoid unneccessary rpc calls
  const [debouncedAddress] = useDebounce(address, 800)

  useEffect(() => {
    if (route.params?.address) {
      setAddress(route.params.address)
    } else if (contact?.solanaAddress) {
      setAddress(contact.solanaAddress)
    }
  }, [contact, route])

  const handleDomainAddress = useCallback(
    async ({ domain }: { domain: string }) => {
      if (!connection) return
      return fetchDomainOwner(connection, domain)
    },
    [connection],
  )

  useEffect(() => {
    // only parse addresses which include dots.
    if (debouncedAddress.split('.').length === 2) {
      handleDomainAddress({ domain: debouncedAddress }).then(
        (resolvedAddress) => {
          // owner was not found so we do not set the owner address
          if (!resolvedAddress) return
          setAddress(resolvedAddress)
          // if nickname was previously set we ignore setting the domain as nickname
          if (nickname) return
          setNickname(debouncedAddress)
        },
      )
    }
  }, [debouncedAddress, handleDomainAddress, nickname])

  const onRequestClose = useCallback(() => {
    homeNav.goBack()
  }, [homeNav])

  const isAddingContact = useMemo(() => action === 'add', [action])
  const isEditingContact = useMemo(() => action === 'edit', [action])

  const handleCreateNewContact = useCallback(() => {
    let solanaAddress = ''

    solanaAddress = address

    addContact({
      address: heliumAddressFromSolAddress(solanaAddress),
      solanaAddress,
      alias: nickname,
      netType: accountNetType(address),
    })
    addressBookNav.goBack()
  }, [addContact, address, addressBookNav, nickname])

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

    if (solAddressIsValid(scannedAddress)) {
      setAddress(scannedAddress)
      setScannedAddress(undefined)
    }
  }, [scannedAddress, setScannedAddress])

  const addressIsValid = useMemo(() => {
    return solAddressIsValid(address)
  }, [address])

  return (
    <SafeAreaBox
      flex={1}
      style={backgroundStyle}
      borderRadius="xl"
      edges={['top']}
    >
      <Box flex={1} backgroundColor="surfaceSecondary">
        <Box
          marginTop="s"
          style={{ paddingTop: Platform.OS === 'android' ? 24 : 0 }}
          flexDirection="row"
          alignItems="center"
        >
          <Box flex={1} />
          <Text variant="subtitle2">
            {isAddingContact
              ? t('addNewContact.title')
              : t('editContact.title')}
          </Text>
          <Box flex={1} alignItems="flex-end">
            <CloseButton
              onPress={onRequestClose}
              paddingVertical="s"
              paddingHorizontal="m"
            />
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
                  network: 'Solana',
                })}
              </Text>
              <AddressExtra
                onScanPress={handleScanAddress}
                isValidAddress={addressIsValid}
                addressLoading={false}
              />
            </Box>
            <TextInput
              variant="plain"
              textInputProps={{
                placeholder: t('addNewContact.address.placeholder'),
                onChangeText: handleAddressChange,
                value: address,
                autoCapitalize: 'none',
                multiline: true,
                returnKeyType: 'next',
                autoComplete: 'off',
                autoCorrect: false,
                onKeyPress: handleKeydown,
              }}
              paddingVertical="xl"
            />
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
              textInputProps={{
                placeholder: t('addNewContact.nickname.placeholder'),
                onChangeText: setNickname,
                value: nickname,
                autoCapitalize: 'words',
                autoComplete: 'off',
                returnKeyType: 'done',
                autoCorrect: false,
              }}
              ref={nicknameInput}
            />
            <ButtonPressable
              visible={isAddingContact}
              backgroundColor="blueBright500"
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
              marginBottom="l"
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
    </SafeAreaBox>
  )
}

export default memo(ContactDetails)
