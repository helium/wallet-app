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
import ButtonPressable from '../../components/ButtonPressable'
import AccountIcon from '../../components/AccountIcon'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import {
  AddressBookNavigationProp,
  AddressBookStackParamList,
} from './addressBookTypes'
import { accountNetType } from '../../utils/accountUtils'
import { useAppStorage } from '../../storage/AppStorageProvider'

const BUTTON_HEIGHT = 55

type Route = RouteProp<AddressBookStackParamList, 'AddNewContact'>

const AddNewContact = () => {
  const { keyboardShown } = useKeyboard()
  const { t } = useTranslation()
  const homeNav = useNavigation<HomeNavigationProp>()
  const addressBookNav = useNavigation<AddressBookNavigationProp>()
  const route = useRoute<Route>()
  const { backgroundStyle } = useOpacity(
    'surfaceSecondary',
    keyboardShown ? 0.85 : 0.4,
  )
  const { addContact } = useAccountStorage()
  const [nickname, setNickname] = useState('')
  const [address, setAddress] = useState(route.params?.address || '')
  const nicknameInput = useRef<RNTextInput | null>(null)
  const { blueBright500, primaryText } = useColors()
  const { scannedAddress, setScannedAddress } = useAppStorage()
  const spacing = useSpacing()

  const onRequestClose = useCallback(() => {
    homeNav.goBack()
  }, [homeNav])

  const addressIsValid = useMemo(() => {
    if (!address) return false
    return Address.isValid(address)
  }, [address])

  const handleCreateNewContact = useCallback(() => {
    addContact({ address, alias: nickname, netType: accountNetType(address) })
    addressBookNav.goBack()
  }, [addContact, address, addressBookNav, nickname])

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
    if (scannedAddress && Address.isValid(scannedAddress)) {
      setAddress(scannedAddress)
      setScannedAddress(undefined)
    }
  }, [scannedAddress, setScannedAddress])

  return (
    <SafeAreaBox flex={1} edges={['top']}>
      <Box flexDirection="row" alignItems="center">
        <Box flex={1} />
        <Text variant="subtitle2">{t('addNewContact.title')}</Text>
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
                <QR color={primaryText} />
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
          <ButtonPressable
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
        </SafeAreaBox>
      </KeyboardAvoidingView>
    </SafeAreaBox>
  )
}

export default memo(AddNewContact)
