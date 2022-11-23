import { useState } from 'react'
import { Transaction } from '@solana/web3.js'
import { AnchorProvider, Wallet } from '@project-serum/anchor'
import { useAsync } from 'react-async-hook'
import { getConnection } from './solanaUtils'
import { useAppStorage } from '../storage/AppStorageProvider'
import { useAccountStorage } from '../storage/AccountStorageProvider'
import { getSolanaKeypair } from '../storage/secureStorage'

export function useAnchorProvider() {
  const [anchorProvider, setAnchorProvider] = useState<AnchorProvider | null>(
    null,
  )

  const { currentAccount } = useAccountStorage()
  const { solanaNetwork: cluster } = useAppStorage()

  useAsync(async () => {
    const connection = getConnection(cluster)

    if (!currentAccount || !currentAccount.address || !connection) return
    const secureAcct = await getSolanaKeypair(currentAccount.address)

    if (!secureAcct) return

    const anchorWallet = {
      publicKey: secureAcct?.publicKey,
      signAllTransactions: async (transactions: Transaction[]) => {
        return transactions.map((tx) => {
          tx.partialSign(secureAcct)
          return tx
        })
      },
      signTransaction: async (transaction: Transaction) => {
        transaction.partialSign(secureAcct)
        return transaction
      },
    } as Wallet

    setAnchorProvider(
      new AnchorProvider(connection, anchorWallet, {
        preflightCommitment: 'confirmed',
      }),
    )
  }, [currentAccount])

  return anchorProvider
}
