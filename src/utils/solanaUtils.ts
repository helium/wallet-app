import * as web3 from '@solana/web3.js'
import { getKeypair } from '../storage/secureStorage'

export const solKeypairFromPK = (heliumPK: Buffer): web3.Keypair => {
  return web3.Keypair.fromSecretKey(heliumPK)
}

export const heliumAddressToSolAddress = async (heliumAddress: string) => {
  const keypair = await getKeypair(heliumAddress)
  if (!keypair) return
  return solKeypairFromPK(keypair.privateKey).publicKey.toBase58()
}
