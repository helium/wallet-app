import { PROGRAM_ID as HELIUM_ENTITY_MANAGER_PROGRAM_ID } from '@helium/helium-entity-manager-sdk'
import { PROGRAM_ID as LAZY_DISTRIBUTOR_PROGRAM_ID } from '@helium/lazy-distributor-sdk'
import { PROGRAM_ID as BUBBLEGUM_PROGRAM_ID } from '@metaplex-foundation/mpl-bubblegum'
import { sha256 } from '@noble/hashes/sha256'
import { ConfirmedSignatureInfo } from '@solana/web3.js'
import bs58 from 'bs58'
import { EnrichedTransaction } from '../../../types/solana'

// No @helium SDK exports the transfer proxy program id.
const TRANSFER_PROXY_PROGRAM_ID = 'Gz9o1yxV5kVfyC53fFu7StTVeetPZWa2sohzvxJiLxMP'

// Response of POST /v1/parsed-events/transactions, one item per requested
// signature, in request order.
export type ParsedInstruction = {
  programId: string
  programName: string | null
  instructionName: string | null
  rawData: string
}

export type ParsedTransaction = {
  slot: number
  blockTime: number
  fee: number
  error: unknown
  nativeTransfers: {
    fromUserAccount: string | null
    toUserAccount: string | null
    amount: number
  }[]
  tokenTransfers: {
    fromUserAccount: string | null
    toUserAccount: string | null
    fromTokenAccount: string | null
    toTokenAccount: string | null
    rawTokenAmount: number
    decimals: number
    mint: string
  }[]
  instructions: ParsedInstruction[]
  summary: { type: string } | null
}

export type ParsedEventsItem =
  | { signature: string; parserStatus: 'OK'; parsed: ParsedTransaction }
  | { signature: string; parserStatus: 'ERROR'; parserError: string }

export type SignatureRow = ConfirmedSignatureInfo & { signers: string[] }

export type ActivityRow = EnrichedTransaction | SignatureRow

// Activity type per program id, then per instruction name.
const INSTRUCTION_TYPES: Record<string, Record<string, string>> = {
  [HELIUM_ENTITY_MANAGER_PROGRAM_ID.toBase58()]: {
    onboard_iot_hotspot_v0: 'HOTSPOT_ONBOARDED',
    onboard_mobile_hotspot_v0: 'HOTSPOT_ONBOARDED',
    onboard_data_only_iot_hotspot_v0: 'HOTSPOT_ONBOARDED',
    onboard_data_only_mobile_hotspot_v0: 'HOTSPOT_ONBOARDED',
  },
  [LAZY_DISTRIBUTOR_PROGRAM_ID.toBase58()]: {
    distribute_compression_rewards_v0: 'CLAIM_REWARDS',
  },
  [TRANSFER_PROXY_PROGRAM_ID]: {
    transfer_cnft: 'COMPRESSED_NFT_TRANSFER',
  },
  [BUBBLEGUM_PROGRAM_ID.toBase58()]: {
    mint_v1: 'COMPRESSED_NFT_MINT',
    mint_to_collection_v1: 'COMPRESSED_NFT_MINT',
    mint_v2: 'COMPRESSED_NFT_MINT',
    transfer: 'COMPRESSED_NFT_TRANSFER',
    transfer_v2: 'COMPRESSED_NFT_TRANSFER',
    update_metadata: 'COMPRESSED_NFT_UPDATE_METADATA',
    update_metadata_v2: 'COMPRESSED_NFT_UPDATE_METADATA',
  },
}

const SUMMARY_TYPES: Record<string, string> = {
  transfer: 'TRANSFER',
  swap: 'SWAP',
  create_account: 'INITIALIZE_ACCOUNT',
  create_token_account: 'INITIALIZE_ACCOUNT',
  add_liquidity: 'ADD_TO_POOL',
  remove_liquidity: 'REMOVE_FROM_POOL',
}

const anchorDiscriminator = (name: string) =>
  Buffer.from(sha256(`global:${name}`).slice(0, 8)).toString('hex')

// Parsed Events leaves Bubblegum v2 instructions undecoded.
const BUBBLEGUM_V2_BY_DISCRIMINATOR: Record<string, string> =
  Object.fromEntries(
    ['mint_v2', 'transfer_v2', 'update_metadata_v2'].map((name) => [
      anchorDiscriminator(name),
      name,
    ]),
  )

const instructionNameOf = (ix: ParsedInstruction): string | undefined => {
  if (ix.instructionName) return ix.instructionName
  if (ix.programId !== BUBBLEGUM_PROGRAM_ID.toBase58()) return undefined
  const discriminator = Buffer.from(bs58.decode(ix.rawData).slice(0, 8))
  return BUBBLEGUM_V2_BY_DISCRIMINATOR[discriminator.toString('hex')]
}

const classify = (parsed: ParsedTransaction): string => {
  const instructionType = parsed.instructions
    .map((ix) => {
      const name = instructionNameOf(ix)
      return name ? INSTRUCTION_TYPES[ix.programId]?.[name] : undefined
    })
    .find(Boolean)
  return (
    instructionType ||
    (parsed.summary && SUMMARY_TYPES[parsed.summary.type]) ||
    'UNKNOWN'
  )
}

const toEnrichedTransaction = (
  signature: string,
  parsed: ParsedTransaction,
  signers: string[],
): EnrichedTransaction => ({
  signature,
  signers,
  description: '',
  type: classify(parsed),
  fee: parsed.fee,
  slot: parsed.slot,
  timestamp: parsed.blockTime,
  transactionError: parsed.error,
  nativeTransfers: parsed.nativeTransfers.map((transfer) => ({
    fromUserAccount: transfer.fromUserAccount ?? '',
    toUserAccount: transfer.toUserAccount ?? '',
    amount: transfer.amount,
  })),
  tokenTransfers: parsed.tokenTransfers.map((transfer) => ({
    fromUserAccount: transfer.fromUserAccount ?? '',
    toUserAccount: transfer.toUserAccount ?? '',
    fromTokenAccount: transfer.fromTokenAccount ?? '',
    toTokenAccount: transfer.toTokenAccount ?? '',
    tokenAmount: transfer.rawTokenAmount / 10 ** transfer.decimals,
    mint: transfer.mint,
  })),
  events: {},
})

// A row per Parsed Events item. A transaction the parser failed on keeps its
// bare signature row, so history never loses it.
export const toActivityRows = (
  items: ParsedEventsItem[],
  signatureRows: SignatureRow[],
): ActivityRow[] => {
  const rowsBySignature = new Map(
    signatureRows.map((row) => [row.signature, row]),
  )
  return items.flatMap((item): ActivityRow[] => {
    const signatureRow = rowsBySignature.get(item.signature)
    if (item.parserStatus === 'ERROR') {
      return signatureRow ? [signatureRow] : []
    }
    return [
      toEnrichedTransaction(
        item.signature,
        item.parsed,
        signatureRow?.signers ?? [],
      ),
    ]
  })
}
