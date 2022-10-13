import * as web3 from '@solana/web3.js'
import Address from '@helium/address'

export const solKeypairFromPK = (heliumPK: Buffer) => {
  return web3.Keypair.fromSecretKey(heliumPK)
}

export const heliumAddressToSolAddress = (heliumAddress: string) => {
  const heliumPK = Address.fromB58(heliumAddress).publicKey
  const pk = new web3.PublicKey(heliumPK)
  return pk.toBase58()
}
