import OneSignal from 'react-native-onesignal'
import Config from 'react-native-config'
import Bcrypt from 'bcrypt-react-native'

export const tagAccount = async (address: string) => {
  if (!Config.ONE_SIGNAL_ACCOUNT_TAG_SALT) return

  try {
    const salt = Config.ONE_SIGNAL_ACCOUNT_TAG_SALT
    const hash = await Bcrypt.hash(salt, address)
    OneSignal.OneSignal.User.addTag(hash, ' ')
  } catch (err) {
    console.error(err)
  }
}

export const removeAccountTag = async (address: string) => {
  if (!Config.ONE_SIGNAL_ACCOUNT_TAG_SALT) return

  try {
    const salt = Config.ONE_SIGNAL_ACCOUNT_TAG_SALT
    const hash = await Bcrypt.hash(salt, address)
    OneSignal.OneSignal.User.removeTag(hash)
  } catch (err) {
    console.error(err)
  }
}
