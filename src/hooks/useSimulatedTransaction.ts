import { toNumber, truthy, sendAndConfirmWithRetry } from '@helium/spl-utils'
import useAlert from '@hooks/useAlert'
import { Metaplex } from '@metaplex-foundation/js'
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
import { useBalance } from '@utils/Balance'
import { getCollectableByMint } from '@utils/solanaUtils'
import BN from 'bn.js'
import { useCallback, useMemo, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { useSolana } from '../solana/SolanaProvider'
import * as logger from '../utils/logger'
import { useHntSolConvert } from './useHntSolConvert'

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
  estimateFeeErr?: Error | undefined
  simulationError: boolean
  insufficientFunds: boolean
  balanceChanges?: BalanceChanges
}
export function useSimulatedTransaction(
  serializedTx: Buffer | undefined,
  wallet: PublicKey | undefined,
): SimulatedTransactionResult {
  const { showOKCancelAlert } = useAlert()
  const { tokenAccounts } = useBalance()
  const { connection, anchorProvider, cluster } = useSolana()
  const { t: tr } = useTranslation()
  const { hntSolConvertTransaction, hntEstimate, hasEnoughSol } =
    useHntSolConvert()

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
    try {
      const tx = VersionedTransaction.deserialize(serializedTx)
      return tx
    } catch (err) {
      logger.error(err)
    }
  }, [serializedTx])

  const showHNTConversionAlert = useCallback(async () => {
    if (!anchorProvider || !hntSolConvertTransaction) return

    const decision = await showOKCancelAlert({
      title: tr('browserScreen.insufficientSolToPayForFees'),
      message: tr('browserScreen.wouldYouLikeToConvert', {
        amount: hntEstimate,
        ticker: 'HNT',
      }),
    })

    if (!decision) return
    const signed = await anchorProvider.wallet.signTransaction(
      hntSolConvertTransaction,
    )
    await sendAndConfirmWithRetry(
      anchorProvider.connection,
      signed.serialize(),
      {
        skipPreflight: true,
      },
      'confirmed',
    )
  }, [
    anchorProvider,
    showOKCancelAlert,
    tr,
    hntSolConvertTransaction,
    hntEstimate,
  ])

  const {
    result: solFee,
    loading: loadingFee,
    error: estimateFeeErr,
  } = useAsync(
    async (
      c: Connection | undefined,
      t: VersionedTransaction | undefined,
    ): Promise<number> => {
      let fee = 5000

      if (!c || !t) {
        return Promise.resolve(fee)
      }

      try {
        fee = (await c?.getFeeForMessage(t.message, 'confirmed')).value || fee
      } catch (err) {
        logger.error(err)
      }

      return fee
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
      if (
        !connection ||
        !transaction ||
        !anchorProvider ||
        !metaplex ||
        !wallet ||
        !simulationAccounts ||
        !tokenAccounts
      )
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
          console.warn(result?.value.logs?.join('\n'))
          if (JSON.stringify(result?.value.err).includes('{"Custom":1}')) {
            if (!hasEnoughSol) {
              await showHNTConversionAlert()
            }
            setInsufficientFunds(true)
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
                    metaplex,
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
                      symbol: tokenMetadata?.symbol,
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
      simulationAccounts,
      connection,
      transaction,
      tokenAccounts,
      hasEnoughSol,
      metaplex,
      anchorProvider,
      wallet,
    ])

  return {
    loading: loadingBal || loadingAccounts || loadingFee,
    simulationError,
    insufficientFunds,
    balanceChanges: estimatedBalanceChanges,
    solFee: solFee || 5000,
    estimateFeeErr,
  }
}
