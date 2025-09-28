import { Program } from '@coral-xyz/anchor'
import {
  init as initDataCredits,
  mintDataCredits,
} from '@helium/data-credits-sdk'
import { useOwnedAmount } from '@helium/helium-react-hooks'
import { DataCredits } from '@helium/idls/lib/types/data_credits'
import { DC_MINT, sendAndConfirmWithRetry } from '@helium/spl-utils'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import BN from 'bn.js'
import { Buffer } from 'buffer'
import { useAsyncCallback } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { useSolana } from '../solana/SolanaProvider'
import { useWalletSign } from '../solana/WalletSignProvider'
import { WalletStandardMessageTypes } from '../solana/walletSignBottomSheetTypes'

export function useImplicitBurn(): {
  implicitBurn: (requiredDc: number) => void
  loading: boolean
  error?: Error
} {
  const { anchorProvider } = useSolana()
  const { walletSignBottomSheetRef } = useWalletSign()
  const { t } = useTranslation()
  const wallet = useCurrentWallet()
  const { amount: myDc, loading: loadingDc } = useOwnedAmount(wallet, DC_MINT)

  const {
    execute: implicitBurn,
    loading,
    error,
  } = useAsyncCallback(async (totalDcReq: number) => {
    if (!anchorProvider) throw new Error('No anchor provider')
    if (loadingDc) throw new Error('Still loading balances')
    if (!wallet) throw new Error('No wallet')

    if ((myDc || BigInt(0)) < BigInt(totalDcReq)) {
      const program = (await initDataCredits(
        anchorProvider,
      )) as unknown as Program<DataCredits>
      const dcDeficit = BigInt(totalDcReq) - (myDc || BigInt(0))
      const { txs } = await mintDataCredits({
        dcAmount: new BN(dcDeficit.toString()),
        dcMint: DC_MINT,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        program,
        recipient: wallet,
      })
      if (!walletSignBottomSheetRef) {
        throw new Error('No wallet bottom sheet')
      }
      const decision = await walletSignBottomSheetRef.show({
        type: WalletStandardMessageTypes.signTransaction,
        url: '',
        serializedTxs: txs.map(({ tx }) => Buffer.from(tx.serialize())),
        header: t('transactions.buyDc'),
      })
      if (decision) {
        // eslint-disable-next-line no-restricted-syntax
        for (const tx of txs) {
          const signed = await anchorProvider.wallet.signTransaction(tx.tx)
          const serializedTx = Buffer.from(signed.serialize())
          await sendAndConfirmWithRetry(
            anchorProvider.connection,
            serializedTx,
            { skipPreflight: true },
            'confirmed',
          )
        }
      } else {
        throw new Error('User rejected transaction')
      }
    }
  })

  return {
    implicitBurn,
    loading,
    error,
  }
}
