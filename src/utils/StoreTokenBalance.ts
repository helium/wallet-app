import { useTokenAccount } from '@helium/helium-react-hooks'
import { PublicKey } from '@solana/web3.js'
import { useEffect } from 'react'
import { AccountLayout } from '@solana/spl-token'
import { useAccountStorage } from '../storage/AccountStorageProvider'
import { balancesSlice } from '../store/slices/balancesSlice'
import { useAppDispatch } from '../store/store'
import { useSolana } from '../solana/SolanaProvider'

type TokenInput = {
  tokenAccount: string
  type: 'dcEscrow' | 'sol'
}

const StoreTokenBalance = ({ tokenAccount, type }: TokenInput) => {
  const tokenAccountResponse = useTokenAccount(new PublicKey(tokenAccount))
  const { currentAccount } = useAccountStorage()
  const dispatch = useAppDispatch()
  const { cluster } = useSolana()

  useEffect(() => {
    const accountData = tokenAccountResponse?.account?.data
    const account = tokenAccountResponse?.info

    if ((!accountData?.length && !account) || !currentAccount?.solanaAddress)
      return

    let amount = 0n

    if (account?.amount !== undefined) {
      amount = account.amount
    } else if (accountData?.length) {
      const decoded = AccountLayout.decode(accountData)
      amount = decoded.amount
    }

    dispatch(
      balancesSlice.actions.updateBalance({
        cluster,
        solanaAddress: currentAccount?.solanaAddress,
        balance: amount,
        type,
        tokenAccount,
      }),
    )
  }, [
    cluster,
    currentAccount?.solanaAddress,
    dispatch,
    tokenAccount,
    tokenAccountResponse,
    type,
  ])

  return null
}

export default StoreTokenBalance
