import { useSolOwnedAmount } from '@helium/helium-react-hooks'
import { usePublicKey } from '@hooks/usePublicKey'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useSolana } from '../solana/SolanaProvider'
import { updateSolBalance } from './balances'

type Props = {
  solanaAddress: string
}

const StoreSolBalance = ({ solanaAddress }: Props) => {
  const key = usePublicKey(solanaAddress)
  const { amount } = useSolOwnedAmount(key)
  const queryClient = useQueryClient()
  const { cluster } = useSolana()

  useEffect(() => {
    if (typeof amount === 'undefined') return

    updateSolBalance(queryClient, {
      cluster,
      solanaAddress,
      balance: Number(amount),
      tokenAccount: solanaAddress,
    })
  }, [amount, cluster, queryClient, solanaAddress])

  return null
}

export default StoreSolBalance
