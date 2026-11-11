import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { TFunction } from 'i18next'
import { EnrichedTransaction } from '../../../types/solana'
import { DEFAULT_TOKENS } from '../../account/logic/visibleTokens'

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

const involvesWallet =
  (wallet: string) =>
  (transfer: { fromUserAccount: string; toUserAccount: string }) =>
    transfer.fromUserAccount === wallet || transfer.toUserAccount === wallet

const walletTokenTransfersOf = (tx: EnrichedTransaction, wallet: string) =>
  tx.tokenTransfers.filter(involvesWallet(wallet))

type TokenTransfer = EnrichedTransaction['tokenTransfers'][number]

// The wallet's token transfers as one sum. Transfers of different mints, or in
// different directions for the wallet, give no sum.
const tokenTransferOf = (transfers: TokenTransfer[], wallet: string) => {
  const [first] = transfers
  if (first?.decimals === undefined) return undefined
  const sent = first.fromUserAccount === wallet
  if (
    transfers.some(
      (transfer) =>
        transfer.mint !== first.mint ||
        transfer.decimals !== first.decimals ||
        (transfer.fromUserAccount === wallet) !== sent,
    )
  ) {
    return undefined
  }
  const total = transfers.reduce((sum, { tokenAmount }) => sum + tokenAmount, 0)
  // Any mint can claim any symbol in its own metadata, so only known mints
  // get one.
  const symbol = DEFAULT_TOKENS.has(first.mint)
    ? transfers.find((transfer) => transfer.tokenMetadata?.symbol)
        ?.tokenMetadata?.symbol
    : undefined
  return {
    from: first.fromUserAccount,
    to: first.toUserAccount,
    amount: formatAmount(total, first.decimals),
    symbol,
  }
}

// The wallet's SOL transfers as one sum. Transfers in different directions for
// the wallet, or a sum that is not a number, give no sum.
const solTransferOf = (tx: EnrichedTransaction, wallet: string) => {
  const transfers = tx.nativeTransfers.filter(involvesWallet(wallet))
  const [first] = transfers
  if (!first) return undefined
  const sent = first.fromUserAccount === wallet
  if (
    transfers.some((transfer) => (transfer.fromUserAccount === wallet) !== sent)
  ) {
    return undefined
  }
  const total =
    transfers.reduce((sum, { amount }) => sum + amount, 0) / LAMPORTS_PER_SOL
  if (!Number.isFinite(total)) return undefined
  return {
    from: first.fromUserAccount,
    to: first.toUserAccount,
    amount: formatAmount(total, SOL_DECIMALS),
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
      const tokenTransfers = walletTokenTransfersOf(tx, wallet)
      const transfer = tokenTransfers.length
        ? tokenTransferOf(tokenTransfers, wallet)
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
      const transfer = tokenTransferOf(
        walletTokenTransfersOf(tx, wallet),
        wallet,
      )
      if (!transfer?.symbol) return ''
      const { amount, symbol } = transfer
      return t('activityScreen.descriptions.claimed', { amount, symbol })
    }
    case 'HOTSPOT_ONBOARDED':
      return t('activityScreen.descriptions.hotspotOnboarded')
    case 'COMPRESSED_NFT_TRANSFER': {
      const compressed = tx.events.compressed?.[0]
      // The sender controls the asset metadata, so the row never shows its name.
      const name = t('activityScreen.descriptions.compressedNFT')
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
      // Mints carry no compressed event, so no metadata to name them.
      if (typeof symbol !== 'string' || !symbol)
        return t('activityScreen.descriptions.mintedNFT')
      return t('activityScreen.compressedNFTDescription', {
        symbol: symbol.toLowerCase(),
        count: compressed.length,
      })
    }
    default:
      return ''
  }
}
