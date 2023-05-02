import { AccountLayout, NATIVE_MINT, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import {
  AddressLookupTableAccount,
  Connection,
  ParsedAccountData,
  PublicKey,
  RpcResponseAndContext,
  SimulatedTransactionAccountInfo,
  VersionedTransaction,
} from '@solana/web3.js'
import BN from 'bn.js'
import { useMemo, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { toNumber } from '@helium/spl-utils'
import { useBalance } from '@utils/Balance'
import { getCollectableByMint } from '@utils/solanaUtils'
import { Metaplex } from '@metaplex-foundation/js'
import { useSolana } from '../solana/SolanaProvider'

type BalanceChanges = {
  nativeChange?: number
  mint?: PublicKey
  symbol?: string
  type?: 'send' | 'recieve'
} | null

export type SimulatedTransactionResult = {
  loading: boolean
  solFee?: number
  estimateFeeErr?: Error | undefined
  simulationError: boolean
  insufficientFunds: boolean
  balanceChanges?: BalanceChanges
}
export function useSimualtedTransaction(
  serializedTx: Buffer | undefined,
  wallet: PublicKey,
): SimulatedTransactionResult {
  const { tokenAccounts } = useBalance()
  const { connection, anchorProvider, cluster } = useSolana()

  const [simulationError, setSimulationError] = useState(false)
  const [insufficientFunds, setInsufficientFunds] = useState(false)

  const metaplex = useMemo(() => {
    if (!connection || !cluster) return
    return new Metaplex(connection, {
      cluster,
    })
  }, [connection, cluster])

  const transaction = useMemo(() => {
    if (!serializedTx) return undefined
    return VersionedTransaction.deserialize(serializedTx)
  }, [serializedTx])
  const {
    result: solFee,
    loading: loadingFee,
    error: estimateFeeErr,
  } = useAsync(
    async (
      c: Connection | undefined,
      t: VersionedTransaction | undefined,
    ): Promise<RpcResponseAndContext<number | null>> => {
      if (!c || !t) {
        return Promise.resolve({ context: { slot: 0, err: null }, value: null })
      }
      return c?.getFeeForMessage(t.message, 'confirmed')
    },
    [connection, transaction],
  )

  const {
    result: simulationAccounts,
    loading: loadingAccounts,
    // error: getAccountsErr,
  } = useAsync(async () => {
    if (!connection || !transaction) return []
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
  const { loading: loadingBal, result: estimatedBalanceChanges } =
    useAsync(async () => {
      if (!connection || !transaction || !anchorProvider || !metaplex)
        return undefined

      setSimulationError(false)
      setInsufficientFunds(false)

      try {
        const { blockhash } = await connection?.getLatestBlockhash()
        transaction.message.recentBlockhash = blockhash
        const result = await connection?.simulateTransaction(transaction, {
          accounts: {
            encoding: 'base64',
            addresses:
              simulationAccounts?.map((account) => account.toBase58()) || [],
          },
        })

        if (result?.value.err) {
          console.warn('failed to simulate', result?.value.err)
          if (
            JSON.stringify(result?.value.err).includes(
              'InstructionError":[0,{"Custom":1}]',
            )
          ) {
            setInsufficientFunds(true)
          }
          setSimulationError(true)
          return undefined
        }

        const balanceChangeInitialValueAsPromise: Promise<BalanceChanges> =
          new Promise((resolve) => {
            resolve(null)
          })

        const accounts = result?.value.accounts

        if (!accounts) return undefined

        const balanceChanges = accounts.reduce(
          async (
            prev: Promise<BalanceChanges>,
            curr: SimulatedTransactionAccountInfo | null,
            index: number,
          ) => {
            const account = curr
            if (!account) return prev
            // Token changes
            const isToken = account.owner === TOKEN_PROGRAM_ID.toString()
            const isNativeSol = account.owner === NATIVE_MINT.toBase58()

            if (isToken || isNativeSol) {
              try {
                let accountNativeBalance: BN
                let tokenMint: PublicKey

                // Parse token accounts for change in balances
                if (isToken) {
                  try {
                    const tokenAccount = AccountLayout.decode(
                      Buffer.from(
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        account.data[0] as any,
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        account.data[1] as any,
                      ),
                    )

                    if (
                      !new PublicKey(tokenAccount.owner).equals(
                        new PublicKey(wallet),
                      )
                    ) {
                      // Return the reducer state umodified if token account is not owned
                      return await prev
                    }
                    accountNativeBalance = new BN(
                      tokenAccount.amount.toString(),
                    )
                    // Standard token mint
                    tokenMint = new PublicKey(tokenAccount.mint)
                  } catch (error) {
                    // Decoding of token account failed, not a token account
                    return prev
                  }
                  // Parse changes in native SOL balances
                } else {
                  // Not interested in SOL balance changes for accounts that
                  // are not the current address
                  if (
                    simulationAccounts &&
                    simulationAccounts[index].equals(wallet)
                  ) {
                    return await prev
                  }
                  accountNativeBalance = new BN(account.lamports.toString())
                  // Faux mint for native SOL
                  tokenMint = new PublicKey(NATIVE_MINT)
                }

                // Find the existing token account
                const existingTokenAccount = tokenAccounts.find((t) =>
                  new PublicKey(t.mint).equals(tokenMint),
                )

                const existingNativeBalance = existingTokenAccount
                  ? new BN(existingTokenAccount.balance)
                  : new BN(0)

                const token = await connection.getParsedAccountInfo(tokenMint)

                const { decimals } = (token.value?.data as ParsedAccountData)
                  .parsed.info

                const tokenMetadata = await getCollectableByMint(
                  tokenMint,
                  metaplex,
                )

                // Calculate the native balance change
                const nativeChange = accountNativeBalance.sub(
                  existingNativeBalance,
                )

                const type = nativeChange.lt(existingNativeBalance)
                  ? 'send'
                  : 'recieve'

                // Filter out zero change
                if (!nativeChange.eq(new BN(0))) {
                  return {
                    nativeChange: Math.abs(toNumber(nativeChange, decimals)),
                    decimals,
                    mint: tokenMint,
                    symbol: tokenMetadata?.symbol,
                    type,
                  } as BalanceChanges
                }
              } catch (err) {
                // ignore, probably not a token account or some other
                // failure, we don't want to fail displaying the popup
                console.warn('failed to get balance changes', err)
                return prev
              }
            }
            return prev
          },
          balanceChangeInitialValueAsPromise,
        )

        return await balanceChanges
      } catch (err) {
        return undefined
      }
    }, [simulationAccounts, connection, transaction, tokenAccounts])

  return {
    loading: loadingBal || loadingAccounts || loadingFee,
    simulationError,
    insufficientFunds,
    balanceChanges: estimatedBalanceChanges,
    solFee: solFee?.value ? solFee.value : 5000,
    estimateFeeErr,
  }
}
