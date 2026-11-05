import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { TFunction } from 'i18next'
import { EnrichedTransaction } from '../../../types/solana'

const SOL_DECIMALS = 9

type Direction = 'sent' | 'received' | 'unknown'

// Sent when the wallet is the source, received when it is the destination.
// Without a known source, a transaction the wallet signed counts as sent.
// Otherwise the wallet is not a known party.
const directionOf = (
  tx: EnrichedTransaction,
  wallet: string,
  { from, to }: { from?: string; to?: string },
): Direction => {
  if (from === wallet) return 'sent'
  if (to === wallet) return 'received'
  if (!from && tx.signers.includes(wallet)) return 'sent'
  return 'unknown'
}

// Never exponent form: 1 lamport reads 0.000000001, not 1e-9.
const formatAmount = (amount: number, decimals: number) =>
  amount.toLocaleString(undefined, {
    maximumFractionDigits: Math.min(decimals, 20),
  })

const walletTokenTransferOf = (tx: EnrichedTransaction, wallet: string) =>
  tx.tokenTransfers.find(
    (transfer) =>
      transfer.fromUserAccount === wallet || transfer.toUserAccount === wallet,
  )

const tokenTransferOf = (tx: EnrichedTransaction, wallet: string) => {
  const tokenTransfer = walletTokenTransferOf(tx, wallet)
  if (tokenTransfer?.decimals === undefined) return undefined
  return {
    from: tokenTransfer.fromUserAccount,
    to: tokenTransfer.toUserAccount,
    amount: formatAmount(tokenTransfer.tokenAmount, tokenTransfer.decimals),
    symbol: tokenTransfer.tokenMetadata?.symbol,
  }
}

const solTransferOf = (tx: EnrichedTransaction, wallet: string) => {
  const nativeTransfer = tx.nativeTransfers.find(
    (transfer) =>
      transfer.fromUserAccount === wallet || transfer.toUserAccount === wallet,
  )
  if (!nativeTransfer) return undefined
  return {
    from: nativeTransfer.fromUserAccount,
    to: nativeTransfer.toUserAccount,
    amount: formatAmount(
      nativeTransfer.amount / LAMPORTS_PER_SOL,
      SOL_DECIMALS,
    ),
    symbol: 'SOL',
  }
}

// The row description, built from the activity type and the current wallet.
// An empty string lets the row fall back to Success / Error.
export const describeActivity = (
  tx: EnrichedTransaction,
  wallet: string,
  t: TFunction,
): string => {
  if (tx.transactionError) return ''
  switch (tx.type) {
    case 'TRANSFER': {
      // The SOL transfer only describes a row with no token transfer of the
      // wallet, so a token send never reads as its rent.
      const transfer = walletTokenTransferOf(tx, wallet)
        ? tokenTransferOf(tx, wallet)
        : solTransferOf(tx, wallet)
      if (!transfer?.symbol) return ''
      const { amount, symbol } = transfer
      const direction = directionOf(tx, wallet, transfer)
      if (direction === 'unknown') return ''
      return direction === 'sent'
        ? t('activityScreen.descriptions.sent', { amount, symbol })
        : t('activityScreen.descriptions.received', { amount, symbol })
    }
    case 'CLAIM_REWARDS': {
      const transfer = tokenTransferOf(tx, wallet)
      if (!transfer?.symbol) return ''
      const { amount, symbol } = transfer
      return t('activityScreen.descriptions.claimed', { amount, symbol })
    }
    case 'HOTSPOT_ONBOARDED':
      return t('activityScreen.descriptions.hotspotOnboarded')
    case 'COMPRESSED_NFT_TRANSFER': {
      const compressed = tx.events.compressed?.[0]
      const name =
        compressed?.metadata?.name ||
        t('activityScreen.descriptions.compressedNFT')
      const direction = directionOf(tx, wallet, {
        from: compressed?.oldLeafOwner,
        to: compressed?.newLeafOwner,
      })
      if (direction === 'unknown') return ''
      return direction === 'sent'
        ? t('activityScreen.descriptions.sentNFT', { name })
        : t('activityScreen.descriptions.receivedNFT', { name })
    }
    case 'COMPRESSED_NFT_MINT': {
      const compressed = tx.events.compressed ?? []
      const symbol = compressed[0]?.metadata?.symbol
      // Bubblegum v2 mints have no asset id, so no metadata to name them.
      if (!symbol) return t('activityScreen.descriptions.mintedNFT')
      return t('activityScreen.compressedNFTDescription', {
        symbol: symbol.toLowerCase(),
        count: compressed.length,
      })
    }
    default:
      return ''
  }
}
