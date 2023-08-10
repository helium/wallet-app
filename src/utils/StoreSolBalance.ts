import { useSolOwnedAmount } from '@helium/helium-react-hooks'
import { usePublicKey } from '@hooks/usePublicKey'
import { useEffect } from 'react'
import { useSolana } from '../solana/SolanaProvider'
import { balancesSlice } from '../store/slices/balancesSlice'
import { useAppDispatch } from '../store/store'

type Props = {
  solanaAddress: string
}

const StoreSolBalance = ({ solanaAddress }: Props) => {
  const key = usePublicKey(solanaAddress)
  const { amount } = useSolOwnedAmount(key)
  const dispatch = useAppDispatch()
  const { cluster } = useSolana()

  useEffect(() => {
    if (typeof amount === 'undefined') return

    dispatch(
      balancesSlice.actions.updateBalance({
        cluster,
        solanaAddress,
        balance: Number(amount),
        tokenAccount: solanaAddress,
      }),
    )
  }, [amount, cluster, dispatch, solanaAddress])

  return null
}

export default StoreSolBalance
