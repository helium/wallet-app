import { sha256 } from '@noble/hashes/sha256'
import bs58 from 'bs58'
import i18next from 'i18next'
import en from '../../../../locales/en'
import { EnrichedTransaction } from '../../../../types/solana'
import {
  ParsedEventsItem,
  ParsedInstruction,
  toActivityRows,
} from '../parsedEvents'
import enhanced from './fixtures/v0.json'
import enhancedFailed from './fixtures/v0-failed.json'
import parsedEvents from './fixtures/v1.json'
import parsedEventsFailed from './fixtures/v1-failed.json'

const i18n = i18next.createInstance()
i18n.init({ lng: 'en', resources: { en: { translation: en } } })

// The same fallback the activity screens apply to `type`.
const renderedType = (type: string) =>
  i18n.exists(`activityScreen.enrichedTransactionTypes.${type}`)
    ? type
    : 'UNKNOWN'

const ONBOARDING =
  '2esPnpkCMWYfop4dzgswQNV68Z6iZphSf5rApAp9nfZoLURydFySqJGouUo2z2BtCEno4ifiqZSKPhUttc864jWY'
const REWARD_CLAIM =
  '5kjuCwQUGQapVDwtf7L2ZgCxBs2bS5iKJMF17oVzLCYDbnCHBT93Bg57B61RgYhN6bBrUMREeWW9MABtm4V4JUhQ'
const CNFT_TRANSFER =
  '3qCKo3qy2J1BgQoTwDfVDyyTidFm6WGACAtnuVXFFyCEfurG7Ae9cxt6z7qJa2FLqMea4GN2NqQ2ywnoKnmkoqMU'
const FAILED_RUN_TASK =
  '53bmbS7T2B15WSZRmgUPmHkavw31aDzwEFz1xAiJ5rneEiiJbp4j5cH5HLXrsi9gyk5NnLnvx5R18Xg786E6oWMF'

const items = [
  ...parsedEvents,
  ...parsedEventsFailed,
] as unknown as ParsedEventsItem[]
const enhancedBySignature = new Map(
  ([...enhanced, ...enhancedFailed] as unknown as EnrichedTransaction[]).map(
    (tx) => [tx.signature, tx],
  ),
)

// What getSignaturesForAddress gives for each signature.
const signatureRows = items.map((item) => ({
  signature: item.signature,
  slot: 1,
  err: null,
  memo: null,
  blockTime: 1,
  signers: [`signer-of-${item.signature}`],
}))

const rowFor = (signature: string, from = items) =>
  toActivityRows(from, signatureRows).find(
    (row) => row.signature === signature,
  ) as EnrichedTransaction

const withoutProgram = (item: ParsedEventsItem, programName: string) => {
  if (item.parserStatus !== 'OK') throw new Error('expected an OK item')
  return {
    ...item,
    parsed: {
      ...item.parsed,
      instructions: item.parsed.instructions.filter(
        (ix) => ix.programName !== programName,
      ),
    },
  }
}

const itemFor = (signature: string) =>
  items.find((item) => item.signature === signature) as ParsedEventsItem

// The cNFT transfer with only its Bubblegum instruction, changed by `patch`.
const withBubblegumInstruction = (patch: Partial<ParsedInstruction>) => {
  const item = itemFor(CNFT_TRANSFER)
  if (item.parserStatus !== 'OK') throw new Error('expected an OK item')
  const bubblegum = item.parsed.instructions.find(
    (ix) => ix.programName === 'bubblegum',
  ) as ParsedInstruction
  return {
    ...item,
    parsed: { ...item.parsed, instructions: [{ ...bubblegum, ...patch }] },
  }
}

const undecoded = (name: string) => ({
  instructionName: null,
  rawData: bs58.encode(sha256(`global:${name}`).slice(0, 8)),
})

describe('instruction classifier', () => {
  it.each([
    [{ instructionName: 'mint_v1' }, 'COMPRESSED_NFT_MINT'],
    [{ instructionName: 'update_metadata' }, 'COMPRESSED_NFT_UPDATE_METADATA'],
    [undecoded('mint_v2'), 'COMPRESSED_NFT_MINT'],
    [undecoded('update_metadata_v2'), 'COMPRESSED_NFT_UPDATE_METADATA'],
  ])('reads Bubblegum %o as %s', async (patch, expected) => {
    const item = withBubblegumInstruction(patch)

    expect((await rowFor(CNFT_TRANSFER, [item])).type).toBe(expected)
  })
})

describe('toActivityRows', () => {
  it.each([
    [ONBOARDING, 'HOTSPOT_ONBOARDED'],
    [REWARD_CLAIM, 'CLAIM_REWARDS'],
    [CNFT_TRANSFER, 'COMPRESSED_NFT_TRANSFER'],
    [FAILED_RUN_TASK, 'UNKNOWN'],
  ])('renders %s as %s', (signature, expected) => {
    expect(renderedType(rowFor(signature).type)).toBe(expected)
  })

  it('keeps the error of a failed transaction, so the row shows its signature', () => {
    expect(rowFor(FAILED_RUN_TASK).transactionError).toEqual(
      enhancedBySignature.get(FAILED_RUN_TASK)?.transactionError,
    )
    expect(rowFor(REWARD_CLAIM).transactionError).toBeNull()
  })

  it.each([ONBOARDING, REWARD_CLAIM, CNFT_TRANSFER, FAILED_RUN_TASK])(
    'adapts %s to the fields Enhanced gave',
    (signature) => {
      const row = rowFor(signature)
      const before = enhancedBySignature.get(signature) as EnrichedTransaction

      expect(row.signature).toBe(before.signature)
      expect(row.timestamp).toBe(before.timestamp)
      expect(row.slot).toBe(before.slot)
      expect(row.fee).toBe(before.fee)
      expect(row.nativeTransfers).toEqual(before.nativeTransfers)
      expect(row.tokenTransfers).toEqual(
        before.tokenTransfers.map(
          ({
            fromUserAccount,
            toUserAccount,
            fromTokenAccount,
            toTokenAccount,
            tokenAmount,
            mint,
          }) => ({
            fromUserAccount,
            toUserAccount,
            fromTokenAccount,
            toTokenAccount,
            tokenAmount,
            mint,
          }),
        ),
      )
    },
  )

  it('attaches the signers of the same signature', () => {
    expect(rowFor(CNFT_TRANSFER).signers).toEqual([
      `signer-of-${CNFT_TRANSFER}`,
    ])
  })

  it('shows a transaction the parser failed on as its bare signature row', () => {
    const failed: ParsedEventsItem = {
      signature: REWARD_CLAIM,
      parserStatus: 'ERROR',
      parserError: 'could not parse',
    }

    const [row] = toActivityRows([failed], signatureRows)

    expect(row).toEqual(
      signatureRows.find((sig) => sig.signature === REWARD_CLAIM),
    )
  })

  it('reads an undecoded Bubblegum v2 instruction from its discriminator', () => {
    const bubblegumOnly = withoutProgram(
      itemFor(CNFT_TRANSFER),
      'transfer_proxy',
    )

    expect(rowFor(CNFT_TRANSFER, [bubblegumOnly]).type).toBe(
      'COMPRESSED_NFT_TRANSFER',
    )
  })

  it('falls back to the summary type when no instruction matches', () => {
    const noDistributor = withoutProgram(
      itemFor(REWARD_CLAIM),
      'lazy_distributor',
    )

    expect(rowFor(REWARD_CLAIM, [noDistributor]).type).toBe('TRANSFER')
  })
})
