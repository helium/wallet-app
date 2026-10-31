import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import {
  KeyboardAvoidingView,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
  TextInput as RNTextInput,
  Platform,
  View,
} from 'react-native'
import { useKeyboard } from '@react-native-community/hooks'
import { SafeAreaView } from 'react-native-safe-area-context'
import { withUniwind } from 'uniwind'
import { Check, X } from 'lucide-react-native'
import { AccountIcon } from '@ui/AccountIcon'
import { Button } from '@ui/Button'
import { Input } from '@ui/Input'
import { PressableScale } from '@ui/PressableScale'
import { Text } from '@ui/Text'
import useAlert from '@hooks/useAlert'
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

const SafeArea = withUniwind(SafeAreaView)
const CheckIcon = withUniwind(Check)
const CloseIcon = withUniwind(X)

// The buttons sit `mt-15` (60) below the nickname input and are `h-10` (40).
const BUTTONS_OFFSET = 60 + 40

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
  const surfaceClass = keyboardShown ? 'bg-card/85' : 'bg-card/40'
  const { addContact, editContact, deleteContact } = useAccountStorage()
  const [nickname, setNickname] = useState(contact?.alias || '')
  const [address, setAddress] = useState(
    route.params?.address || contact?.solanaAddress || '',
  )
  const nicknameInput = useRef<RNTextInput | null>(null)
  const { scannedAddress, setScannedAddress } = useAppStorage()
  const { showOKCancelAlert } = useAlert()
  const { connection } = useSolana()
  // debounce is needed to avoid unneccessary rpc calls
  const [debouncedAddress] = useDebounce(address, 800)

  const [prevContact, setPrevContact] = useState(contact)
  const [prevRoute, setPrevRoute] = useState(route)
  if (prevContact !== contact || prevRoute !== route) {
    setPrevContact(contact)
    setPrevRoute(route)
    if (route.params?.address) {
      setAddress(route.params.address)
    } else if (contact?.solanaAddress) {
      setAddress(contact.solanaAddress)
    }
  }

  const [prevScannedAddress, setPrevScannedAddress] = useState<string>()
  if (prevScannedAddress !== scannedAddress) {
    setPrevScannedAddress(scannedAddress)
    if (scannedAddress && solAddressIsValid(scannedAddress)) {
      setAddress(scannedAddress)
    }
  }

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
      void handleDomainAddress({ domain: debouncedAddress }).then(
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

  const onRequestClose = () => {
    homeNav.goBack()
  }

  const isAddingContact = action === 'add'
  const isEditingContact = action === 'edit'

  const handleCreateNewContact = () => {
    let solanaAddress = ''

    solanaAddress = address

    void addContact({
      address: heliumAddressFromSolAddress(solanaAddress),
      solanaAddress,
      alias: nickname,
      netType: accountNetType(address),
    })
    addressBookNav.goBack()
  }

  const handleDeleteContact = async () => {
    const decision = await showOKCancelAlert({
      title: t('editContact.deleteConfirmTitle'),
      message: t('editContact.deleteConfirmMessage', { alias: nickname }),
    })
    if (decision) {
      void deleteContact(contact?.solanaAddress || address)
      addressBookNav.goBack()
    }
  }

  const handleSaveNewContact = () => {
    if (!contact) return
    void editContact(contact.address, {
      address: heliumAddressFromSolAddress(address),
      solanaAddress: address,
      alias: nickname,
      netType: accountNetType(address),
    })
    addressBookNav.goBack()
  }

  const handleKeydown = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
  ) => {
    if (e.nativeEvent.key === 'Enter') {
      nicknameInput.current?.focus()
    }
  }

  const handleAddressChange = (text: string) => {
    setAddress(text.trim())
  }

  const handleScanAddress = () => {
    addressBookNav.push('ScanAddress')
  }

  useEffect(() => {
    if (!scannedAddress) return

    if (solAddressIsValid(scannedAddress)) {
      setScannedAddress(undefined)
    }
  }, [scannedAddress, setScannedAddress])

  const addressIsValid = solAddressIsValid(address)

  return (
    <SafeArea
      className={`flex-1 rounded-[20px] ${surfaceClass}`}
      edges={['top']}
    >
      <View className="flex-1 bg-secondary">
        <View className="mt-2 flex-row items-center android:pt-6">
          <View className="flex-1" />
          <Text size="lg" className="font-medium">
            {isAddingContact
              ? t('addNewContact.title')
              : t('editContact.title')}
          </Text>
          <View className="flex-1 items-end">
            <PressableScale
              onPress={onRequestClose}
              feedback="opacity"
              className="px-4 py-2"
            >
              <CloseIcon size={18} colorClassName="accent-foreground" />
            </PressableScale>
          </View>
        </View>
        <View className="flex-1 items-center justify-center">
          {addressIsValid && (
            <AccountIcon address={address} size={nickname ? 85 : 122} />
          )}
          {!!nickname && (
            <Text size="4xl" className={addressIsValid ? 'mt-4' : 'mt-0'}>
              {nickname}
            </Text>
          )}
        </View>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'android' ? undefined : 'position'}
          keyboardVerticalOffset={-BUTTONS_OFFSET}
        >
          <SafeArea
            className={`rounded-[20px] ${surfaceClass}`}
            edges={['bottom']}
          >
            <View className="mx-8 mb-2 mt-8 flex-row justify-between">
              <Text size="base">
                {t('addNewContact.address.title', {
                  network: 'Solana',
                })}
              </Text>
              <AddressExtra
                onScanPress={handleScanAddress}
                isValidAddress={addressIsValid}
                addressLoading={false}
              />
            </View>
            <Input
              placeholder={t('addNewContact.address.placeholder')}
              onChangeText={handleAddressChange}
              value={address}
              autoCapitalize="none"
              multiline
              returnKeyType="next"
              autoComplete="off"
              autoCorrect={false}
              onKeyPress={handleKeydown}
              className="h-auto rounded-none border-0 px-8 py-8 text-lg shadow-none"
            />
            <View className="mx-8 mb-2 mt-4 flex-row justify-between">
              <Text size="base">{t('addNewContact.nickname.title')}</Text>
              {!!nickname && (
                <CheckIcon size={16} colorClassName="accent-blue-dark-500" />
              )}
            </View>
            <Input
              placeholder={t('addNewContact.nickname.placeholder')}
              onChangeText={setNickname}
              value={nickname}
              autoCapitalize="words"
              autoComplete="off"
              returnKeyType="done"
              autoCorrect={false}
              ref={nicknameInput}
              className="h-auto rounded-none border-0 px-8 py-4 text-lg shadow-none"
            />
            {isAddingContact && (
              <Button
                variant="cta"
                size="lg"
                className="mx-8 mb-6 mt-15"
                disabled={!addressIsValid || !nickname}
                onPress={handleCreateNewContact}
              >
                {t('addNewContact.addContact')}
              </Button>
            )}
            {isEditingContact && (
              <View className="mx-8 mt-15 flex-row justify-center gap-4">
                <Button
                  variant="destructive"
                  size="lg"
                  className="flex-1"
                  onPress={() =>
                    void handleDeleteContact().catch(console.error)
                  }
                >
                  {t('editContact.delete')}
                </Button>
                <Button
                  variant="cta"
                  size="lg"
                  className="flex-1"
                  disabled={
                    !addressIsValid ||
                    !nickname ||
                    (nickname === contact?.alias &&
                      address === contact?.solanaAddress)
                  }
                  onPress={handleSaveNewContact}
                >
                  {t('editContact.save')}
                </Button>
              </View>
            )}
          </SafeArea>
        </KeyboardAvoidingView>
      </View>
    </SafeArea>
  )
}

export default ContactDetails
