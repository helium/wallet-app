import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SecureStore from 'expo-secure-store'
import * as aesjs from 'aes-js'
import 'react-native-get-random-values'
import crypto from 'crypto'

// Reference: https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native?auth-store=secure-store#initialize-a-react-native-app

// As Expo's SecureStore does not support values larger than 2048
// bytes, an AES-256 key is generated and stored in SecureStore, while
// it is used to encrypt/decrypt values stored in AsyncStorage.
const encrypt = async (key: string, value: string) => {
  const encryptionKey = crypto.randomBytes(256 / 8)

  // eslint-disable-next-line new-cap
  const cipher = new aesjs.ModeOfOperation.ctr(
    encryptionKey,
    new aesjs.Counter(1),
  )
  const encryptedBytes = cipher.encrypt(aesjs.utils.utf8.toBytes(value))

  await SecureStore.setItemAsync(key, aesjs.utils.hex.fromBytes(encryptionKey))

  return aesjs.utils.hex.fromBytes(encryptedBytes)
}

const decrypt = async (key: string, value: string) => {
  const encryptionKeyHex = await SecureStore.getItemAsync(key)
  if (!encryptionKeyHex) {
    return encryptionKeyHex
  }

  // eslint-disable-next-line new-cap
  const cipher = new aesjs.ModeOfOperation.ctr(
    aesjs.utils.hex.toBytes(encryptionKeyHex),
    new aesjs.Counter(1),
  )
  const decryptedBytes = cipher.decrypt(aesjs.utils.hex.toBytes(value))

  return aesjs.utils.utf8.fromBytes(decryptedBytes)
}

export const getItem = async (key: string) => {
  const encrypted = await AsyncStorage.getItem(key)
  if (!encrypted) {
    return encrypted
  }

  return decrypt(key, encrypted)
}

export const removeItem = async (key: string) => {
  await AsyncStorage.removeItem(key)
  await SecureStore.deleteItemAsync(key)
}

export const setItem = async (key: string, value: string) => {
  const encrypted = await encrypt(key, value)

  await AsyncStorage.setItem(key, encrypted)
}
