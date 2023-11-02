import { HNT_MINT, IOT_MINT, MOBILE_MINT } from '@helium/spl-utils'
import { PublicKey } from '@solana/web3.js'

const mintsToNetwork = {
  [HNT_MINT.toBase58()]: 'Helium',
  [MOBILE_MINT.toBase58()]: 'Helium MOBILE',
  [IOT_MINT.toBase58()]: 'Helium IOT',
}

export const useGovNetwork = (mint: PublicKey) => {
  const network = mintsToNetwork[mint.toBase58()]
  return { network }
}
