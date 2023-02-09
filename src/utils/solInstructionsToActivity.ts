import * as web3 from '@solana/web3.js'
import { Mints } from '../store/slices/walletRestApi'
import { Activity, Payment } from '../types/activity'
import { mintToTicker } from '../types/solana'

export default (
  parsedTxn: web3.ParsedTransactionWithMeta | null,
  signature: string,
  mints: Mints,
) => {
  if (!parsedTxn) return

  const activity: Activity = { hash: signature, type: 'unknown' }

  const { transaction, slot, blockTime, meta } = parsedTxn

  activity.fee = meta?.fee
  activity.height = slot

  if (blockTime) {
    activity.time = blockTime
  }

  if (meta?.preTokenBalances && meta.postTokenBalances) {
    const { preTokenBalances, postTokenBalances } = meta
    let payments = [] as Payment[]
    postTokenBalances.forEach((post) => {
      const preBalance = preTokenBalances.find(
        ({ accountIndex }) => accountIndex === post.accountIndex,
      )
      const pre = preBalance || { uiTokenAmount: { amount: '0' } }
      const preAmount = parseInt(pre.uiTokenAmount.amount, 10)
      const postAmount = parseInt(post.uiTokenAmount.amount, 10)
      const amount = postAmount - preAmount
      if (amount < 0) {
        // is payer
        activity.payer = post.owner
        activity.tokenType = mintToTicker(post.mint, mints)
        activity.amount = -1 * amount
      } else {
        // is payee
        const p: Payment = {
          amount,
          payee: post.owner || '',
          tokenType: mintToTicker(post.mint, mints),
        }
        payments = [...payments, p]
      }
    })
    activity.payments = payments
  }

  const transfer = transaction.message.instructions.find((i) => {
    const instruction = i as web3.ParsedInstruction
    return instruction?.parsed?.type === 'transferChecked'
  }) as web3.ParsedInstruction

  if (transfer) {
    // We have a payment
    activity.type = 'payment_v2'
  }

  const payment = activity.payments?.[0]
  if (payment && payment.tokenType === 'DC') {
    activity.type = payment.payee !== activity.payer ? 'dc_delegate' : 'dc_mint'
    activity.amount = payment.amount
    activity.tokenType = 'DC'
  }

  if (activity.type === 'unknown') return

  return activity
}
