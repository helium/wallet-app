import { init as initDataCredits } from '@helium/data-credits-sdk'
import { useOwnedAmount } from '@helium/helium-react-hooks'
import { DC_MINT, sendAndConfirmWithRetry } from '@helium/spl-utils'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import {
  createAssociatedTokenAccountIdempotentInstruction,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token'
import { Transaction } from '@solana/web3.js'
import { withPriorityFees } from '@utils/priorityFees'
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
      const program = await initDataCredits(anchorProvider)
      const dcDeficit = BigInt(totalDcReq) - (myDc || BigInt(0))
      const burnTx = new Transaction({
        feePayer: wallet,
        recentBlockhash: (await anchorProvider.connection.getLatestBlockhash())
          .blockhash,
      })
      burnTx.add(
        ...(await withPriorityFees({
          connection: anchorProvider.connection,
          feePayer: wallet,
          instructions: [
            await program.methods
              .mintDataCreditsV0({
                hntAmount: null,
                dcAmount: new BN(dcDeficit.toString()),
              })
              .preInstructions([
                createAssociatedTokenAccountIdempotentInstruction(
                  wallet,
                  getAssociatedTokenAddressSync(DC_MINT, wallet, true),
                  wallet,
                  DC_MINT,
                ),
              ])
              .accounts({
                dcMint: DC_MINT,
                recipient: wallet,
              })
              .instruction(),
          ],
        })),
      )
      if (!walletSignBottomSheetRef) {
        throw new Error('No wallet bottom sheet')
      }
      const decision = await walletSignBottomSheetRef.show({
        type: WalletStandardMessageTypes.signTransaction,
        url: '',
        serializedTxs: [burnTx.serialize({ requireAllSignatures: false })],
        header: t('transactions.buyDc'),
      })
      const signed = await anchorProvider.wallet.signTransaction(burnTx)
      const serializedTx = Buffer.from(signed.serialize())
      if (decision) {
        await sendAndConfirmWithRetry(
          anchorProvider.connection,
          serializedTx,
          { skipPreflight: true },
          'confirmed',
        )
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
