import { DC_MINT, HNT_MINT, IOT_MINT, MOBILE_MINT } from '@helium/spl-utils'
import { NATIVE_MINT } from '@solana/spl-token'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { TFunction } from 'i18next'
import { EnrichedTransaction } from '../../../types/solana'

const SOL_DECIMALS = 9
const SOL_MINT = NATIVE_MINT.toBase58()

// Any mint can claim any symbol in its own metadata, so only these mints get
// one, and it comes from here, not from the metadata.
const SYMBOLS = new Map([
  [HNT_MINT.toBase58(), 'HNT'],
  [MOBILE_MINT.toBase58(), 'MOBILE'],
  [IOT_MINT.toBase58(), 'IOT'],
  [DC_MINT.toBase58(), 'DC'],
  [SOL_MINT, 'SOL'],
  ['EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', 'USDC'],
])

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

type Transfer = { fromUserAccount: string; toUserAccount: string }

const involvesWallet = (wallet: string) => (transfer: Transfer) =>
  transfer.fromUserAccount === wallet || transfer.toUserAccount === wallet

// The other party, when every transfer of the wallet has the same one.
const soleCounterpartyOf = (transfers: Transfer[], wallet: string) => {
  const parties = new Set(
    transfers.map((transfer) =>
      transfer.fromUserAccount === wallet
        ? transfer.toUserAccount
        : transfer.fromUserAccount,
    ),
  )
  const [party] = parties
  return parties.size === 1 && party ? party : undefined
}

const walletTokenTransfersOf = (tx: EnrichedTransaction, wallet: string) =>
  tx.tokenTransfers.filter(involvesWallet(wallet))

type TokenTransfer = EnrichedTransaction['tokenTransfers'][number]

// The wallet's token transfers as one sum. Transfers of different mints, in
// different directions for the wallet, or that mix burns with sends, give no
// sum. A burn is a transfer with no destination.
const tokenTransferOf = (transfers: TokenTransfer[], wallet: string) => {
  const [first] = transfers
  if (first?.decimals === undefined) return undefined
  const sent = first.fromUserAccount === wallet
  const burned = !first.toUserAccount
  if (
    transfers.some(
      (transfer) =>
        transfer.mint !== first.mint ||
        transfer.decimals !== first.decimals ||
        (transfer.fromUserAccount === wallet) !== sent ||
        !transfer.toUserAccount !== burned,
    )
  ) {
    return undefined
  }
  const total = transfers.reduce((sum, { tokenAmount }) => sum + tokenAmount, 0)
  return {
    from: first.fromUserAccount,
    to: first.toUserAccount,
    counterparty: soleCounterpartyOf(transfers, wallet),
    amount: formatAmount(total, first.decimals),
    symbol: SYMBOLS.get(first.mint),
    burned,
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
    counterparty: soleCounterpartyOf(transfers, wallet),
    amount: formatAmount(total, SOL_DECIMALS),
    symbol: 'SOL',
    burned: false,
  }
}

type Leg = { mint: string; raw: number; decimals: number }

// The wallet's net change per mint, in raw units, with wSOL as SOL. A mint
// with two decimals or an amount that is not a number gives no change.
const netTokenChangesOf = (tx: EnrichedTransaction, wallet: string) => {
  const changes = new Map<string, Leg>()
  const readable = tx.tokenTransfers
    .filter(involvesWallet(wallet))
    .every(
      ({ mint, tokenAmount, decimals, fromUserAccount, toUserAccount }) => {
        const known = changes.get(mint)
        if (decimals === undefined || (known && known.decimals !== decimals)) {
          return false
        }
        const raw = Math.round(tokenAmount * 10 ** decimals)
        if (!Number.isFinite(raw)) return false
        const sign =
          (toUserAccount === wallet ? 1 : 0) -
          (fromUserAccount === wallet ? 1 : 0)
        changes.set(mint, {
          mint,
          decimals,
          raw: (known?.raw ?? 0) + sign * raw,
        })
        return true
      },
    )
  return readable ? [...changes.values()] : undefined
}

// What the wallet spent and what it got: one mint down and one mint up. A
// route that uses more mints, or ends where it began, gives no swap.
const swapOf = (tx: EnrichedTransaction, wallet: string) => {
  const changes = netTokenChangesOf(tx, wallet)
  if (!changes) return undefined
  const spent = changes.filter(({ raw }) => raw < 0)
  const got = changes.filter(({ raw }) => raw > 0)
  // A swap can pay out or take in native SOL, not wSOL. Count native SOL only
  // for the side the tokens leave empty: it also carries rent and tips.
  if (!changes.some(({ mint }) => mint === SOL_MINT)) {
    const raw = tx.nativeTransfers
      .filter(involvesWallet(wallet))
      .reduce(
        (sum, { fromUserAccount, toUserAccount, amount }) =>
          sum +
          (toUserAccount === wallet ? amount : 0) -
          (fromUserAccount === wallet ? amount : 0),
        0,
      )
    const sol = { mint: SOL_MINT, raw, decimals: SOL_DECIMALS }
    if (!spent.length && raw < 0) spent.push(sol)
    if (!got.length && raw > 0) got.push(sol)
  }
  if (spent.length !== 1 || got.length !== 1) return undefined
  const legOf = ({ mint, raw, decimals }: Leg) => ({
    amount: formatAmount(Math.abs(raw) / 10 ** decimals, decimals),
    symbol: SYMBOLS.get(mint),
  })
  return { spent: legOf(spent[0]), got: legOf(got[0]) }
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
      if (transfer.burned)
        return t('activityScreen.descriptions.burned', { amount, symbol })
      const address = transfer.counterparty
      if (direction === 'received')
        return address
          ? t('activityScreen.descriptions.receivedFrom', {
              amount,
              symbol,
              address,
            })
          : t('activityScreen.descriptions.received', { amount, symbol })
      return address
        ? t('activityScreen.descriptions.sentTo', { amount, symbol, address })
        : t('activityScreen.descriptions.sent', { amount, symbol })
    }
    case 'SWAP': {
      const swap = swapOf(tx, wallet)
      if (!swap?.spent.symbol || !swap.got.symbol) return ''
      return t('activityScreen.descriptions.swapped', {
        spentAmount: swap.spent.amount,
        spentSymbol: swap.spent.symbol,
        gotAmount: swap.got.amount,
        gotSymbol: swap.got.symbol,
      })
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
