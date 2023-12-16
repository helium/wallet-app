import { useTokenAccount } from '@helium/helium-react-hooks'
import { usePublicKey } from '@hooks/usePublicKey'
import { AccountLayout } from '@solana/spl-token'
import { useEffect } from 'react'
import { useSolana } from '../solana/SolanaProvider'
import { useAccountStorage } from '../storage/AccountStorageProvider'
import { balancesSlice } from '../store/slices/balancesSlice'
import { useAppDispatch } from '../store/store'

type TokenInput = {
  tokenAccount: string
  mint: string
}

const StoreAtaBalance = ({ tokenAccount, mint }: TokenInput) => {
  const tokenAccountResponse = useTokenAccount(usePublicKey(tokenAccount))
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
      balancesSlice.actions.updateAtaBalance({
        cluster,
        solanaAddress: currentAccount?.solanaAddress,
        balance: amount,
        mint,
        tokenAccount,
      }),
    )
  }, [
    cluster,
    currentAccount?.solanaAddress,
    dispatch,
    mint,
    tokenAccount,
    tokenAccountResponse,
  ])

  return null
}

export default StoreAtaBalance
