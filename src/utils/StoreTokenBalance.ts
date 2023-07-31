import { useTokenAccount } from '@helium/helium-react-hooks'
import { AccountLayout } from '@solana/spl-token'
import { PublicKey } from '@solana/web3.js'
import { useEffect } from 'react'
import { useSolana } from '../solana/SolanaProvider'
import { useAccountStorage } from '../storage/AccountStorageProvider'
import { balancesSlice } from '../store/slices/balancesSlice'
import { useAppDispatch } from '../store/store'

type TokenInput = {
  tokenAccount: string
}

const StoreTokenBalance = ({ tokenAccount }: TokenInput) => {
  const tokenAccountResponse = useTokenAccount(new PublicKey(tokenAccount))
  const { currentAccount } = useAccountStorage()
  const dispatch = useAppDispatch()
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

    dispatch(
      balancesSlice.actions.updateBalance({
        cluster,
        solanaAddress: currentAccount?.solanaAddress,
        balance: amount,
        tokenAccount,
      }),
    )
  }, [
    cluster,
    currentAccount?.solanaAddress,
    dispatch,
    tokenAccount,
    tokenAccountResponse,
  ])

  return null
}

export default StoreTokenBalance
