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
import Checkmark from '@assets/svgs/checkmark.svg'
import Box from '@components/Box'
import Text from '@components/Text'
import { useColors, useSpacing } from '@config/theme/themeHooks'
import TextInput from '@components/TextInput'
import ButtonPressable from '@components/ButtonPressable'
import AccountIcon from '@components/AccountIcon'
import useAlert from '@hooks/useAlert'
import { solAddressIsValid, accountNetType } from '@utils/accountUtils'
import { heliumAddressFromSolAddress } from '@helium/spl-utils'
import { useDebounce } from 'use-debounce'
import { fetchDomainOwner } from '@utils/getDomainOwner'
import BackScreen from '@components/BackScreen'
import { NavBarHeight } from '@components/ServiceNavBar'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import ScrollBox from '@components/ScrollBox'
import { useAccountStorage } from '@config/storage/AccountStorageProvider'
import { useAppStorage } from '@config/storage/AppStorageProvider'
import { CSAccount } from '@config/storage/cloudStorage'
import { useSolana } from '@features/solana/SolanaProvider'
import AddressExtra from './AddressExtra'
import {
  AddressBookNavigationProp,
  AddressBookStackParamList,
} from './addressBookTypes'
import { solAddressToHelium } from '../../utils/accountUtils'

const BUTTON_HEIGHT = 55

type Route = RouteProp<AddressBookStackParamList, 'AddNewContact'>

type Props = {
  action: 'add' | 'edit'
  contact?: CSAccount
}

const ContactDetails = ({ action, contact }: Props) => {
  const { t } = useTranslation()
  const addressBookNav = useNavigation<AddressBookNavigationProp>()
  const route = useRoute<Route>()
  const { bottom } = useSafeAreaInsets()
  const { addContact, editContact, deleteContact } = useAccountStorage()
  const [nickname, setNickname] = useState(contact?.alias || '')
  const [address, setAddress] = useState('')
  const nicknameInput = useRef<RNTextInput | null>(null)
  const colors = useColors()
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
      address: solAddressToHelium(address),
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
    <ScrollBox flex={1}>
      <BackScreen
        headerTopMargin="6xl"
        edges={[]}
        title={
          isAddingContact ? t('addNewContact.title') : t('editContact.title')
        }
        flex={1}
      >
        <Box
          backgroundColor="primaryBackground"
          flex={1}
          borderRadius="4xl"
          paddingHorizontal="0"
          padding="4"
          style={{
            paddingBottom: NavBarHeight + bottom + spacing.xl,
          }}
        >
          <Box flex={1}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'android' ? undefined : 'position'}
              keyboardVerticalOffset={-spacing['15'] - BUTTON_HEIGHT}
            >
              <Box>
                <Box
                  alignItems="center"
                  justifyContent="center"
                  marginBottom="4"
                >
                  {addressIsValid && (
                    <AccountIcon address={address} size={nickname ? 85 : 122} />
                  )}
                  {!!nickname && (
                    <Text
                      variant="displayMdRegular"
                      marginTop={addressIsValid ? '4' : 'none'}
                      color="primaryText"
                    >
                      {nickname}
                    </Text>
                  )}
                </Box>
                <Box
                  flexDirection="row"
                  marginBottom="2"
                  justifyContent="space-between"
                >
                  <Text variant="textMdRegular" color="secondaryText">
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
                <Box
                  backgroundColor="cardBackground"
                  borderRadius="2xl"
                  padding="4"
                  paddingHorizontal="2"
                >
                  <TextInput
                    variant="transparentSmall"
                    textColor="primaryText"
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
                  />
                </Box>
                <Box
                  flexDirection="row"
                  justifyContent="space-between"
                  marginTop="4"
                  marginBottom="2"
                >
                  <Text variant="textMdRegular" color="secondaryText">
                    {t('addNewContact.nickname.title')}
                  </Text>
                  {!!nickname && <Checkmark color={colors['blue.500']} />}
                </Box>
                <Box
                  backgroundColor="cardBackground"
                  borderRadius="2xl"
                  padding="4"
                  paddingHorizontal="2"
                >
                  <TextInput
                    variant="transparentSmall"
                    textColor="primaryText"
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
                </Box>
                <ButtonPressable
                  visible={isAddingContact}
                  backgroundColor="primaryText"
                  backgroundColorDisabled="bg.disabled"
                  titleColorDisabled="text.disabled"
                  titleColor="primaryBackground"
                  fontSize={19}
                  backgroundColorOpacityPressed={0.7}
                  borderRadius="full"
                  marginTop="2xl"
                  title={t('addNewContact.addContact')}
                  disabled={!addressIsValid || !nickname}
                  onPress={handleCreateNewContact}
                />
                <Box
                  flexDirection="row"
                  justifyContent="center"
                  marginTop="2xl"
                  gap="4"
                  visible={isEditingContact}
                >
                  <ButtonPressable
                    flex={1}
                    backgroundColor="primaryText"
                    titleColor="primaryBackground"
                    fontSize={19}
                    borderRadius="full"
                    title={t('editContact.delete')}
                    onPress={handleDeleteContact}
                  />
                  <ButtonPressable
                    flex={1}
                    backgroundColor="primaryText"
                    titleColor="primaryBackground"
                    fontSize={19}
                    borderRadius="full"
                    title={t('editContact.save')}
                    disabled={
                      !addressIsValid ||
                      !nickname ||
                      (nickname === contact?.alias &&
                        address === contact?.address)
                    }
                    onPress={handleSaveNewContact}
                  />
                </Box>
              </Box>
            </KeyboardAvoidingView>
          </Box>
        </Box>
      </BackScreen>
    </ScrollBox>
  )
}

export default memo(ContactDetails)
