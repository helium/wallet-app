import { PROGRAM_ID as HELIUM_ENTITY_MANAGER_PROGRAM_ID } from '@helium/helium-entity-manager-sdk'
import { PROGRAM_ID as LAZY_DISTRIBUTOR_PROGRAM_ID } from '@helium/lazy-distributor-sdk'
import {
  PROGRAM_ID as BUBBLEGUM_PROGRAM_ID,
  getLeafAssetId,
} from '@metaplex-foundation/mpl-bubblegum'
import { BN } from '@anchor-lang/core'
import { sha256 } from '@noble/hashes/sha256'
import { ConfirmedSignatureInfo, PublicKey } from '@solana/web3.js'
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
  decoded: {
    args: Record<string, unknown>
    accounts: { name: string; pubkey: string }[]
  } | null
}

type ParsedTransaction = {
  slot: number
  blockTime?: number | null
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

type SignatureRow = ConfirmedSignatureInfo & { signers: string[] }

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
    distribute_custom_destination_v0: 'CLAIM_REWARDS',
    distribute_rewards_v0: 'CLAIM_REWARDS',
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

// A table value for an own key only, so a name such as `constructor` reads
// nothing from the prototype.
const ownValueOf = <T>(
  table: Record<string, T> | undefined,
  key: string,
): T | undefined =>
  table && Object.prototype.hasOwnProperty.call(table, key)
    ? table[key]
    : undefined

const classify = (parsed: ParsedTransaction): string => {
  const instructionType = parsed.instructions
    .map((ix) => {
      const name = instructionNameOf(ix)
      return name
        ? ownValueOf(ownValueOf(INSTRUCTION_TYPES, ix.programId), name)
        : undefined
    })
    .find(Boolean)
  return (
    instructionType ||
    (parsed.summary && ownValueOf(SUMMARY_TYPES, parsed.summary.type)) ||
    'UNKNOWN'
  )
}

type CompressedEvent = NonNullable<
  EnrichedTransaction['events']['compressed']
>[number]

// Where a decoded cNFT transfer keeps its leaf index, tree and owners.
const CNFT_TRANSFER_FIELDS: Record<
  string,
  { leafIndex: string; tree: string; oldOwner: string; newOwner: string }
> = {
  [`${TRANSFER_PROXY_PROGRAM_ID}:transfer_cnft`]: {
    leafIndex: 'leaf_index',
    tree: 'merkle_tree',
    oldOwner: 'current_owner',
    newOwner: 'new_leaf_owner',
  },
  [`${BUBBLEGUM_PROGRAM_ID.toBase58()}:transfer`]: {
    leafIndex: 'index',
    tree: 'merkle_tree',
    oldOwner: 'leaf_owner',
    newOwner: 'new_leaf_owner',
  },
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const leafIndexOf = (value: unknown): number | undefined => {
  if (typeof value !== 'number' && (typeof value !== 'string' || !value)) {
    return undefined
  }
  const index = Number(value)
  return Number.isSafeInteger(index) && index >= 0 ? index : undefined
}

const publicKeyOf = (value: unknown): PublicKey | undefined => {
  if (typeof value !== 'string') return undefined
  try {
    return new PublicKey(value)
  } catch {
    return undefined
  }
}

// The asset id is not in the response, so derive it from the tree and leaf.
// Without a valid tree and leaf index, the row has no compressed event.
const compressedEventsOf = async (
  parsed: ParsedTransaction,
): Promise<CompressedEvent[] | undefined> => {
  const found = parsed.instructions
    .map((ix, instructionIndex) => ({
      ix,
      instructionIndex,
      fields: ownValueOf(
        CNFT_TRANSFER_FIELDS,
        `${ix.programId}:${ix.instructionName}`,
      ),
    }))
    .find(({ ix, fields }) => fields && ix.decoded)
  if (!found?.ix.decoded || !found.fields) return undefined
  const { instructionIndex, fields } = found
  const { args, accounts } = found.ix.decoded
  if (!isRecord(args) || !Array.isArray(accounts)) return undefined
  const account = (name: string): unknown =>
    accounts.find((acc) => isRecord(acc) && acc.name === name)?.pubkey
  const owner = (name: string) => {
    const pubkey = account(name)
    return typeof pubkey === 'string' ? pubkey : ''
  }
  const leafIndex = leafIndexOf(args[fields.leafIndex])
  const tree = publicKeyOf(account(fields.tree))
  if (leafIndex === undefined || !tree) return undefined
  const assetId = await getLeafAssetId(tree, new BN(leafIndex))
  return [
    {
      type: 'COMPRESSED_NFT_TRANSFER',
      assetId: assetId.toBase58(),
      treeId: tree.toBase58(),
      leafIndex,
      instructionIndex,
      innerInstructionIndex: 0,
      oldLeafOwner: owner(fields.oldOwner),
      newLeafOwner: owner(fields.newOwner),
      metadata: null,
    },
  ]
}

// A raw amount and decimals the wallet cannot read give no amount.
const tokenAmountOf = (rawTokenAmount: number, decimals: number) =>
  Number.isFinite(rawTokenAmount) && Number.isInteger(decimals) && decimals >= 0
    ? { tokenAmount: rawTokenAmount / 10 ** decimals, decimals }
    : { tokenAmount: 0, decimals: undefined }

const toEnrichedTransaction = async (
  parsed: ParsedTransaction,
  signatureRow: SignatureRow,
): Promise<EnrichedTransaction> => ({
  signature: signatureRow.signature,
  signers: signatureRow.signers,
  description: '',
  type: classify(parsed),
  fee: parsed.fee,
  slot: parsed.slot,
  timestamp: parsed.blockTime ?? signatureRow.blockTime ?? 0,
  transactionError: parsed.error || signatureRow.err || null,
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
    ...tokenAmountOf(transfer.rawTokenAmount, transfer.decimals),
    mint: transfer.mint,
  })),
  events: { compressed: await compressedEventsOf(parsed) },
})

// The response is untrusted. Check the fields the adapter depends on.
export const isReadableItem = (value: unknown): value is ParsedEventsItem => {
  if (!isRecord(value) || typeof value.signature !== 'string') return false
  if (value.parserStatus === 'ERROR') return true
  const { parsed } = value
  return (
    value.parserStatus === 'OK' &&
    isRecord(parsed) &&
    Array.isArray(parsed.instructions) &&
    Array.isArray(parsed.nativeTransfers) &&
    Array.isArray(parsed.tokenTransfers)
  )
}

// A row per signature row, in the same order. A transaction the response
// omits, the parser failed on, or the wallet cannot read keeps its bare
// signature row, so history never loses it. No single item can throw out of
// here.
export const toActivityRows = (
  items: unknown,
  signatureRows: SignatureRow[],
): Promise<ActivityRow[]> => {
  const itemsBySignature = new Map(
    (Array.isArray(items) ? items : [])
      .filter(isRecord)
      .map((item) => [item.signature, item]),
  )
  return Promise.all(
    signatureRows.map(async (signatureRow): Promise<ActivityRow> => {
      const item: unknown = itemsBySignature.get(signatureRow.signature)
      if (!isReadableItem(item) || item.parserStatus === 'ERROR') {
        return signatureRow
      }
      try {
        return await toEnrichedTransaction(item.parsed, signatureRow)
      } catch {
        return signatureRow
      }
    }),
  )
}
