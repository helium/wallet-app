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
import { Address } from '@helium/crypto-react-native'
import Checkmark from '@assets/images/checkmark.svg'
import QR from '@assets/images/qr.svg'
import { useKeyboard } from '@react-native-community/hooks'
import Box from '../../components/Box'
import Text from '../../components/Text'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import { useColors, useOpacity, useSpacing } from '../../theme/themeHooks'
import SafeAreaBox from '../../components/SafeAreaBox'
import { HomeNavigationProp } from '../home/homeTypes'
import TextInput from '../../components/TextInput'
import AccountIcon from '../../components/AccountIcon'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import {
  AddressBookNavigationProp,
  AddressBookStackParamList,
} from './addressBookTypes'
import { accountNetType } from '../../utils/accountUtils'
import useAlert from '../../utils/useAlert'
import BackgroundFill from '../../components/BackgroundFill'
import { useAppStorage } from '../../storage/AppStorageProvider'

type Route = RouteProp<AddressBookStackParamList, 'EditContact'>

const BUTTON_HEIGHT = 55
const EditContact = () => {
  const { keyboardShown } = useKeyboard()
  const route = useRoute<Route>()
  const { contact } = route.params
  const { t } = useTranslation()
  const { primaryText } = useColors()
  const homeNav = useNavigation<HomeNavigationProp>()
  const addressBookNav = useNavigation<AddressBookNavigationProp>()
  const { backgroundStyle } = useOpacity(
    'surfaceSecondary',
    keyboardShown ? 0.85 : 0.4,
  )
  const { editContact, deleteContact } = useAccountStorage()
  const { scannedAddress, setScannedAddress } = useAppStorage()
  const [nickname, setNickname] = useState(contact.alias)
  const [address, setAddress] = useState(contact.address)
  const { showOKCancelAlert } = useAlert()
  const nicknameInput = useRef<RNTextInput | null>(null)
  const { blueBright500, white } = useColors()
  const spacing = useSpacing()

  const onRequestClose = useCallback(() => {
    homeNav.goBack()
  }, [homeNav])

  const addressIsValid = useMemo(() => {
    if (!address) return false
    return Address.isValid(address)
  }, [address])

  const handleSaveNewContact = useCallback(() => {
    editContact(contact.address, {
      address,
      alias: nickname,
      netType: accountNetType(address),
    })
    addressBookNav.goBack()
  }, [editContact, contact.address, address, nickname, addressBookNav])

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

  const handleKeydown = useCallback(
    (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
      if (e.nativeEvent.key === 'Enter') {
        nicknameInput.current?.focus()
      }
    },
    [],
  )

  const handleScanAddress = useCallback(() => {
    addressBookNav.push('ScanAddress')
  }, [addressBookNav])

  const handleAddressChange = useCallback((text: string) => {
    setAddress(text.trim())
  }, [])

  useEffect(() => {
    if (scannedAddress && Address.isValid(scannedAddress)) {
      setAddress(scannedAddress)
      setScannedAddress(undefined)
    }
  }, [scannedAddress, setScannedAddress])

  return (
    <SafeAreaBox flex={1} edges={['top']}>
      <Box flexDirection="row" alignItems="center">
        <Box flex={1} />
        <Text variant="subtitle2">{t('editContact.title')}</Text>
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
            <Text variant="body1">{t('addNewContact.address.title')}</Text>
            {addressIsValid ? (
              <Checkmark color={blueBright500} />
            ) : (
              <TouchableOpacityBox onPress={handleScanAddress}>
                <QR color={white} />
              </TouchableOpacityBox>
            )}
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
          <Box
            flexDirection="row"
            justifyContent="space-between"
            marginTop="l"
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
          <Box flexDirection="row" marginTop="xxxl" marginHorizontal="xl">
            <TouchableOpacityBox
              flex={1}
              minHeight={66}
              justifyContent="center"
              marginEnd="m"
              borderRadius="round"
              onPress={handleDeleteContact}
              overflow="hidden"
            >
              <BackgroundFill backgroundColor="error" />
              <Text variant="subtitle1" textAlign="center" color="error">
                {t('editContact.delete')}
              </Text>
            </TouchableOpacityBox>
            <TouchableOpacityBox
              flex={1}
              minHeight={66}
              backgroundColor="blueBright500"
              justifyContent="center"
              alignItems="center"
              borderRadius="round"
              disabled={
                !addressIsValid ||
                !nickname ||
                (nickname === contact.alias && address === contact.address)
              }
              onPress={handleSaveNewContact}
              flexDirection="row"
            >
              <Text
                marginLeft="s"
                variant="subtitle1"
                textAlign="center"
                color="primaryText"
              >
                {t('editContact.save')}
              </Text>
            </TouchableOpacityBox>
          </Box>
        </SafeAreaBox>
      </KeyboardAvoidingView>
    </SafeAreaBox>
  )
}

export default memo(EditContact)
