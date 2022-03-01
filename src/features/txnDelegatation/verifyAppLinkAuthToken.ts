import { Keypair, WalletLink } from '@helium/react-native-sdk'
import Sodium from 'react-native-sodium'

export default async (token: WalletLink.Token, keypair: Keypair) => {
  const { signature, ...tokenWithoutSignature } = token
  const stringifiedToken = JSON.stringify(tokenWithoutSignature)
  const base64Token = Buffer.from(stringifiedToken).toString('base64')

  const publicKey = keypair?.publicKey.toString('base64')
  if (!publicKey) return false
  return Sodium.crypto_sign_verify_detached(signature, base64Token, publicKey)
}
