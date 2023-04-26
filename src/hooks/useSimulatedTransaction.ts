import { AccountLayout, NATIVE_MINT, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import {
  AddressLookupTableAccount,
  Connection,
  Message,
  PublicKey,
  VersionedTransaction,
} from '@solana/web3.js'
import BN from 'bn.js'
import { useMemo, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { useSolana } from 'src/solana/SolanaProvider'

export type SimulatedTransactionResult = {
  loading: boolean
  solFee?: number
  simulationError: boolean
  balanceChanges?: { nativeChange: BN; mint?: PublicKey }[]
}
export function useSimualtedTransaction(
  serializedTx: Buffer,
  wallet: PublicKey,
): SimulatedTransactionResult {
  const { connection } = useSolana()

  const [simulationError, setSimulationError] = useState(false)

  const tokenAccountsSorted: any[] = [] // todo
  const transaction = useMemo(() => {
    return VersionedTransaction.deserialize(serializedTx)
  }, [serializedTx])
  const {
    result: solFee,
    loading: loadingFee,
    // error: estimateFeeErr,
  } = useAsync(
    // @ts-ignore
    (c: Connection | undefined, t: VersionedTransaction | undefined) => {
      return c?.getFeeForMessage(t.message as Message)
    },
    [connection, transaction],
  )
  const {
    result: simulationAccounts,
    loading: loadingAccounts,
    // error: getAccountsErr,
  } = useAsync(async () => {
    const addressLookupTableAccounts: Array<AddressLookupTableAccount> = []
    const { addressTableLookups } = transaction.message
    if (addressTableLookups.length > 0) {
      // eslint-disable-next-line no-restricted-syntax
      for (const addressTableLookup of addressTableLookups) {
        // eslint-disable-next-line no-await-in-loop
        const result = await connection?.getAddressLookupTable(
          addressTableLookup.accountKey,
        )
        if (result?.value) {
          addressLookupTableAccounts.push(result?.value)
        }
      }
    }
    const accountKeys = transaction.message.getAccountKeys({
      addressLookupTableAccounts,
    })
    return [
      ...new Set(
        accountKeys.staticAccountKeys.concat(
          accountKeys.accountKeysFromLookups
            ? // Only writable accounts will contribute to balance changes
              accountKeys.accountKeysFromLookups.writable
            : [],
        ),
      ),
    ]
  }, [transaction, connection])
  const {
    loading: loadingBal,
    result: estimatedBalanceChanges,
    // error: estimateBalanceChangesErr,
  } = useAsync(async () => {
    const result = await connection?.simulateTransaction(
      transaction.message as Message,
      [],
      simulationAccounts,
    )
    if (result?.value.err) {
      console.warn('failed to simulate', result?.value.err)
      setSimulationError(true)
    }
    const balanceChanges = result?.value.accounts?.map(
      (account: any, index: number) => {
        // Token changes
        const isToken = account.owner === TOKEN_PROGRAM_ID.toString()
        const isNativeSol = account.owner === NATIVE_MINT

        if (isToken || isNativeSol) {
          try {
            let accountNativeBalance: BN
            let tokenMint: PublicKey

            // Parse token accounts for change in balances
            if (isToken) {
              try {
                const tokenAccount = AccountLayout.decode(
                  Buffer.from(account.data[0], account.data[1]),
                )
                if (
                  !new PublicKey(tokenAccount.owner).equals(
                    new PublicKey(wallet),
                  )
                ) {
                  // Return the reducer state umodified if token account is not owned
                  return result
                }
                accountNativeBalance = new BN(tokenAccount.amount.toString())
                // Standard token mint
                tokenMint = new PublicKey(tokenAccount.mint)
              } catch (error) {
                // Decoding of token account failed, not a token account
                return result
              }
              // Parse changes in native SOL balances
            } else {
              // Not interested in SOL balance changes for accounts that
              // are not the current address
              if (
                simulationAccounts &&
                simulationAccounts[index].equals(wallet)
              ) {
                return result
              }
              accountNativeBalance = new BN(account.lamports.toString())
              // Faux mint for native SOL
              tokenMint = new PublicKey(NATIVE_MINT)
            }

            // Find the existing token account
            const existingTokenAccount = tokenAccountsSorted.find((t) =>
              new PublicKey(t.mint!).equals(tokenMint),
            )

            const existingNativeBalance = existingTokenAccount
              ? existingTokenAccount.nativeBalance
              : new BN(0)

            // Calculate the native balance change
            const nativeChange = accountNativeBalance.sub(existingNativeBalance)

            // Filter out zero change
            if (!nativeChange.eq(new BN(0))) {
              return {
                nativeChange,
                decimals: token.decimals,
                mint: tokenMint,
              }
            }
          } catch (err) {
            // ignore, probably not a token account or some other
            // failure, we don't want to fail displaying the popup
            console.warn('failed to get balance changes', err)
            return result
          }
        }
        return result
      },
      {},
    )

    return balanceChanges
  }, [simulationAccounts, connection])

  return {
    loading: loadingBal || loadingAccounts || loadingFee,
    simulationError,
    balanceChanges: estimatedBalanceChanges,
    simulationError,
    solFee: solFee.value,
  }
}
