import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { TFunction } from 'i18next'
import { EnrichedTransaction } from '../../../types/solana'

const SOL_DECIMALS = 9

// Sent when the wallet is the source. Without a known source, a transaction
// the wallet signed counts as sent.
const isSent = (tx: EnrichedTransaction, wallet: string, from?: string) =>
  from ? from === wallet : tx.signers.includes(wallet)

// Never exponent form: 1 lamport reads 0.000000001, not 1e-9.
const formatAmount = (amount: number, decimals: number) =>
  amount.toLocaleString(undefined, {
    maximumFractionDigits: Math.min(decimals, 20),
  })

const tokenTransferOf = (tx: EnrichedTransaction, wallet: string) => {
  const tokenTransfer =
    tx.tokenTransfers.find(
      (transfer) =>
        transfer.fromUserAccount === wallet ||
        transfer.toUserAccount === wallet,
    ) ?? tx.tokenTransfers[0]
  if (tokenTransfer?.decimals === undefined) return undefined
  return {
    from: tokenTransfer.fromUserAccount,
    amount: formatAmount(tokenTransfer.tokenAmount, tokenTransfer.decimals),
    symbol: tokenTransfer.tokenMetadata?.symbol,
  }
}

const solTransferOf = (tx: EnrichedTransaction) => {
  const nativeTransfer = tx.nativeTransfers[0]
  if (!nativeTransfer) return undefined
  return {
    from: nativeTransfer.fromUserAccount,
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
  switch (tx.type) {
    case 'TRANSFER': {
      const transfer = tokenTransferOf(tx, wallet) ?? solTransferOf(tx)
      if (!transfer?.symbol) return ''
      const { amount, symbol } = transfer
      return isSent(tx, wallet, transfer.from)
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
      return isSent(tx, wallet, compressed?.oldLeafOwner)
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
