import { useSolOwnedAmount } from '@helium/helium-react-hooks'
import { toNumber, truthy } from '@helium/spl-utils'
import { AccountLayout, NATIVE_MINT, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import {
  AddressLookupTableAccount,
  Connection,
  ParsedAccountData,
  PublicKey,
  SimulatedTransactionAccountInfo,
  SystemProgram,
  VersionedTransaction,
} from '@solana/web3.js'
import { useAppStorage } from '@storage/AppStorageProvider'
import { useModal } from '@storage/ModalsProvider'
import { useBalance } from '@utils/Balance'
import { MIN_BALANCE_THRESHOLD } from '@utils/constants'
import { getCollectableByMint, isInsufficientBal } from '@utils/solanaUtils'
import BN from 'bn.js'
import { useMemo, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { useSolana } from '../solana/SolanaProvider'
import * as logger from '../utils/logger'
import { useBN } from './useBN'

type BalanceChange = {
  nativeChange?: number
  mint?: PublicKey
  symbol?: string
  type?: 'send' | 'receive'
}
type BalanceChanges = BalanceChange[] | null

export type SimulatedTransactionResult = {
  loading: boolean
  solFee?: number
  priorityFee?: number
  estimateFeeErr?: Error | undefined
  simulationError: boolean
  insufficientFunds: boolean
  balanceChanges?: BalanceChanges
}
export function useSimulatedTransaction(
  serializedTx: Buffer | undefined,
  wallet: PublicKey | undefined,
): SimulatedTransactionResult {
  const { connection, anchorProvider } = useSolana()
  const { tokenAccounts } = useBalance()
  const { showModal } = useModal()
  const solBalance = useBN(useSolOwnedAmount(wallet).amount)
  const hasEnoughSol = useMemo(() => {
    return (solBalance || new BN(0)).gt(new BN(MIN_BALANCE_THRESHOLD))
  }, [solBalance])
  const { autoGasManagementToken } = useAppStorage()

  const [simulationError, setSimulationError] = useState(false)
  const [insufficientFunds, setInsufficientFunds] = useState(false)

  const transaction = useMemo(() => {
    if (!serializedTx) return undefined
    try {
      const tx = VersionedTransaction.deserialize(serializedTx)
      return tx
    } catch (err) {
      logger.error(err)
    }
  }, [serializedTx])

  const {
    result: { solFee, priorityFee } = { solFee: 5000, priorityFee: 0 },
    loading: loadingFee,
    error: estimateFeeErr,
  } = useAsync(
    async (
      c: Connection | undefined,
      t: VersionedTransaction | undefined,
    ): Promise<{ solFee: number; priorityFee: number }> => {
      const sFee = (t?.signatures.length || 1) * 5000
      let pFee = 0

      if (!c || !t) {
        return Promise.resolve({ solFee: sFee, priorityFee: pFee })
      }

      try {
        const fee =
          (await c?.getFeeForMessage(t.message, 'confirmed')).value || solFee
        pFee = fee - sFee
        return {
          priorityFee: pFee,
          solFee: sFee,
        }
      } catch (err) {
        logger.error(err)
      }

      return { solFee: sFee, priorityFee: pFee }
    },
    [connection, transaction],
  )

  const { loading: loadingSim, result: simulatedTxnResult } =
    useAsync(async () => {
      if (!connection || !transaction || !wallet) return undefined

      setSimulationError(false)
      setInsufficientFunds(false)

      try {
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

        const simulationAccounts = [
          ...new Set(
            accountKeys.staticAccountKeys.concat(
              accountKeys.accountKeysFromLookups
                ? // Only writable accounts will contribute to balance changes
                  accountKeys.accountKeysFromLookups.writable
                : [],
            ),
          ),
        ]

        const { blockhash } = await connection?.getLatestBlockhash()
        transaction.message.recentBlockhash = blockhash
        return {
          simulationAccounts,
          simulatedTxn: await connection?.simulateTransaction(transaction, {
            accounts: {
              encoding: 'base64',
              addresses:
                simulationAccounts?.map((account) => account.toBase58()) || [],
            },
          }),
        }
      } catch (err) {
        console.warn('err', err)
        return undefined
      }
    }, [connection, transaction, anchorProvider, wallet])

  const { loading: loadingBal, result: estimatedBalanceChanges } =
    useAsync(async () => {
      if (!simulatedTxnResult || !tokenAccounts || !connection || !wallet) {
        return
      }
      try {
        const { simulatedTxn: result, simulationAccounts } = simulatedTxnResult
        if (result?.value.err) {
          console.warn('failed to simulate', result?.value.err)
          console.warn(result?.value.logs?.join('\n'))
          if (!hasEnoughSol || isInsufficientBal(result?.value.err)) {
            if (!hasEnoughSol && !autoGasManagementToken) {
              showModal({
                type: 'InsufficientSolConversion',
                onCancel: async () => {
                  setInsufficientFunds(true)
                },
                onSuccess: async () => {
                  setInsufficientFunds(false)
                  setSimulationError(false)
                },
              })
            } else {
              setInsufficientFunds(true)
            }
          }
          setSimulationError(true)
          return undefined
        }

        const accounts = result?.value.accounts

        if (!accounts) return undefined

        const balanceChanges = await Promise.all(
          accounts.map(
            async (
              account: SimulatedTransactionAccountInfo | null,
              index: number,
            ) => {
              if (!account) return null

              // Token changes
              const isToken = account.owner === TOKEN_PROGRAM_ID.toString()
              const isNativeSol =
                account.owner === SystemProgram.programId.toBase58()

              if (isToken || isNativeSol) {
                try {
                  let accountNativeBalance: BN
                  let tokenMint: PublicKey
                  let existingNativeBalance: BN

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

                      if (!new PublicKey(tokenAccount.owner).equals(wallet)) {
                        return null
                      }
                      accountNativeBalance = new BN(
                        tokenAccount.amount.toString(),
                      )
                      // Standard token mint
                      tokenMint = new PublicKey(tokenAccount.mint)
                    } catch (error) {
                      // Decoding of token account failed, not a token account
                      return null
                    }

                    // Find the existing token account
                    const existingTokenAccount = tokenAccounts.find((t) =>
                      new PublicKey(t.mint).equals(tokenMint),
                    )

                    existingNativeBalance = existingTokenAccount
                      ? new BN(existingTokenAccount.balance)
                      : new BN(0)
                  } else {
                    // Not interested in SOL balance changes for accounts that
                    // are not the current address
                    if (
                      simulationAccounts &&
                      !simulationAccounts[index].equals(wallet)
                    ) {
                      return null
                    }
                    accountNativeBalance = new BN(account.lamports.toString())
                    // Faux mint for native SOL
                    tokenMint = new PublicKey(NATIVE_MINT)
                    existingNativeBalance = new BN(
                      (
                        await connection.getAccountInfo(
                          simulationAccounts[index],
                        )
                      )?.lamports || 0,
                    )
                    // Don't include fees here
                    // First account is feePayer, if we made it here feePayer is wallet
                    if (index === 0) {
                      accountNativeBalance = accountNativeBalance.add(
                        new BN(solFee || 5000),
                      )
                    }
                  }

                  const token = await connection.getParsedAccountInfo(tokenMint)

                  const { decimals } = (token.value?.data as ParsedAccountData)
                    .parsed.info

                  const tokenMetadata = await getCollectableByMint(
                    tokenMint,
                    connection,
                  )

                  const type = accountNativeBalance.lt(existingNativeBalance)
                    ? 'send'
                    : 'receive'

                  // Filter out zero change
                  if (!accountNativeBalance.eq(existingNativeBalance)) {
                    let nativeChange: BN
                    if (type === 'send') {
                      nativeChange =
                        existingNativeBalance.sub(accountNativeBalance)
                    } else {
                      nativeChange = accountNativeBalance.sub(
                        existingNativeBalance,
                      )
                    }
                    return {
                      nativeChange: Math.abs(toNumber(nativeChange, decimals)),
                      decimals,
                      mint: tokenMint,
                      symbol: tokenMint.equals(NATIVE_MINT)
                        ? 'SOL'
                        : tokenMetadata?.symbol,
                      type,
                    } as BalanceChange
                  }
                } catch (err) {
                  // ignore, probably not a token account or some other
                  // failure, we don't want to fail displaying the popup
                  console.warn('failed to get balance changes', err)
                  return null
                }
              }
              return null
            },
          ),
        )

        return balanceChanges.filter(truthy)
      } catch (err) {
        console.warn('err', err)
        return undefined
      }
    }, [
      simulatedTxnResult,
      connection,
      tokenAccounts,
      hasEnoughSol,
      anchorProvider,
      wallet,
      autoGasManagementToken,
    ])

  return {
    loading: loadingBal || loadingFee || loadingSim,
    simulationError,
    insufficientFunds,
    balanceChanges: estimatedBalanceChanges,
    solFee: solFee || 5000,
    priorityFee,
    estimateFeeErr,
  }
}
