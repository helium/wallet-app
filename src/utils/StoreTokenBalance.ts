import { useTokenAccount } from '@helium/helium-react-hooks'
import { PublicKey } from '@solana/web3.js'
import { useEffect } from 'react'
import { AccountLayout } from '@solana/spl-token'
import { useAccountStorage } from '../storage/AccountStorageProvider'
import { balancesSlice } from '../store/slices/balancesSlice'
import { useAppDispatch } from '../store/store'
import { useSolana } from '../solana/SolanaProvider'

type TokenInput = {
  token: string
  type: 'sol' | 'mobile' | 'dc' | 'iot' | 'hnt' | 'dcEscrow'
}

const StoreTokenBalance = ({ token, type }: TokenInput) => {
  const tokenAccount = useTokenAccount(new PublicKey(token))
  const { currentAccount } = useAccountStorage()
  const dispatch = useAppDispatch()
  const { cluster } = useSolana()

  useEffect(() => {
    const accountData = tokenAccount?.account?.data
    const account = tokenAccount?.info

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
      balancesSlice.actions.updateTokenBalance({
        cluster,
        solanaAddress: currentAccount?.solanaAddress,
        balance: amount,
        type,
      }),
    )
  }, [
    cluster,
    currentAccount?.solanaAddress,
    dispatch,
    tokenAccount?.account?.data,
    tokenAccount?.info,
    type,
  ])

  return null
}

export default StoreTokenBalance
