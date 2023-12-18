import { IdlAccounts } from '@coral-xyz/anchor'
import { useAnchorAccount } from '@helium/helium-react-hooks'
import { HeliumSubDaos } from '@helium/idls/lib/types/helium_sub_daos'
import { PublicKey } from '@solana/web3.js'
import { usePublicKey } from './usePublicKey'

const type = 'subDaoV0'
export type SubDaoV0 = IdlAccounts<HeliumSubDaos>['subDaoV0'] & {
  pubKey: PublicKey
}

export const useSubDao = (subDaoKey: string | undefined, isStatic = false) => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return useAnchorAccount<HeliumSubDaos, type>(
    usePublicKey(subDaoKey),
    type,
    isStatic,
  )
}
