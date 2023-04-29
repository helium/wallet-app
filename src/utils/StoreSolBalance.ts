import { useAccount } from '@helium/helium-react-hooks'
import { PublicKey } from '@solana/web3.js'
import { useEffect } from 'react'
import { balancesSlice } from '../store/slices/balancesSlice'
import { useAppDispatch } from '../store/store'
import { useSolana } from '../solana/SolanaProvider'

type Props = {
  solanaAddress: string
}

const StoreSolBalance = ({ solanaAddress }: Props) => {
  const account = useAccount(new PublicKey(solanaAddress))
  const dispatch = useAppDispatch()
  const { cluster } = useSolana()

  useEffect(() => {
    if (account.account?.lamports === undefined) return

    const amount = account.account?.lamports

    dispatch(
      balancesSlice.actions.updateBalance({
        cluster,
        solanaAddress,
        balance: amount,
        type: 'sol',
        tokenAccount: solanaAddress,
      }),
    )
  }, [account.account?.lamports, cluster, dispatch, solanaAddress])

  return null
}

export default StoreSolBalance
