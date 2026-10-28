import { useTokenAccount } from '@helium/helium-react-hooks'
import { AccountLayout } from '@solana/spl-token'
import { PublicKey } from '@solana/web3.js'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useSolana } from '../solana/SolanaProvider'
import { useAccountStorage } from '../storage/AccountStorageProvider'
import { updateSolBalance } from './balances'

type TokenInput = {
  tokenAccount: string
}

const StoreTokenBalance = ({ tokenAccount }: TokenInput) => {
  const tokenAccountResponse = useTokenAccount(new PublicKey(tokenAccount))
  const { currentAccount } = useAccountStorage()
  const queryClient = useQueryClient()
  const { cluster } = useSolana()

  useEffect(() => {
    const accountData = tokenAccountResponse?.account?.data
    const account = tokenAccountResponse?.info

    if ((!accountData?.length && !account) || !currentAccount?.solanaAddress)
      return

    let amount = 0

    if (account?.amount !== undefined) {
      amount = Number(account.amount)
    } else if (accountData?.length) {
      const decoded = AccountLayout.decode(accountData)
      amount = Number(decoded.amount)
    }

    updateSolBalance(queryClient, {
      cluster,
      solanaAddress: currentAccount?.solanaAddress,
      balance: amount,
      tokenAccount,
    })
  }, [
    cluster,
    currentAccount?.solanaAddress,
    queryClient,
    tokenAccount,
    tokenAccountResponse,
  ])

  return null
}

export default StoreTokenBalance
