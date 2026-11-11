import { PROGRAM_ID as HELIUM_ENTITY_MANAGER_PROGRAM_ID } from '@helium/helium-entity-manager-sdk'
import { PROGRAM_ID as LAZY_DISTRIBUTOR_PROGRAM_ID } from '@helium/lazy-distributor-sdk'
import { PROGRAM_ID as BUBBLEGUM_PROGRAM_ID } from '@metaplex-foundation/mpl-bubblegum'
import { sha256 } from '@noble/hashes/sha256'
import bs58 from 'bs58'
import i18next from 'i18next'
import en from '../../../../locales/en'
import { EnrichedTransaction } from '../../../../types/solana'
import { describeActivity } from '../describeActivity'
import {
  ParsedEventsItem,
  ParsedInstruction,
  isReadableItem,
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

const rowFor = async (signature: string, from = items) =>
  (await toActivityRows(from, signatureRows)).find(
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

// The reward claim with only `instructions` and the given summary.
const withInstructions = (
  instructions: Partial<ParsedInstruction>[],
  summary: { type: string } | null = null,
) => {
  const item = itemFor(REWARD_CLAIM)
  if (item.parserStatus !== 'OK') throw new Error('expected an OK item')
  return {
    ...item,
    parsed: {
      ...item.parsed,
      summary,
      instructions: instructions.map((ix) => ({
        programName: null,
        instructionName: null,
        rawData: '',
        decoded: null,
        programId: '',
        ...ix,
      })),
    },
  }
}

const TRANSFER_PROXY_PROGRAM_ID = 'Gz9o1yxV5kVfyC53fFu7StTVeetPZWa2sohzvxJiLxMP'

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

  it.each([
    [
      HELIUM_ENTITY_MANAGER_PROGRAM_ID.toBase58(),
      'onboard_iot_hotspot_v0',
      'HOTSPOT_ONBOARDED',
    ],
    [
      LAZY_DISTRIBUTOR_PROGRAM_ID.toBase58(),
      'distribute_custom_destination_v0',
      'CLAIM_REWARDS',
    ],
    [
      LAZY_DISTRIBUTOR_PROGRAM_ID.toBase58(),
      'distribute_rewards_v0',
      'CLAIM_REWARDS',
    ],
    [TRANSFER_PROXY_PROGRAM_ID, 'transfer_cnft', 'COMPRESSED_NFT_TRANSFER'],
    [BUBBLEGUM_PROGRAM_ID.toBase58(), 'transfer', 'COMPRESSED_NFT_TRANSFER'],
  ])(
    'reads %s %s with no summary as %s',
    async (programId, instructionName, expected) => {
      const item = withInstructions([{ programId, instructionName }])

      expect((await rowFor(REWARD_CLAIM, [item])).type).toBe(expected)
    },
  )

  it.each([
    ['swap', 'SWAP'],
    ['create_account', 'INITIALIZE_ACCOUNT'],
    ['create_token_account', 'INITIALIZE_ACCOUNT'],
    ['add_liquidity', 'ADD_TO_POOL'],
    ['remove_liquidity', 'REMOVE_FROM_POOL'],
  ])('reads summary %s as %s', async (type, expected) => {
    const item = withInstructions([], { type })

    expect((await rowFor(REWARD_CLAIM, [item])).type).toBe(expected)
  })

  it.each([
    ['an inherited summary type', [], { type: 'constructor' }],
    [
      'an inherited instruction name',
      [
        {
          programId: LAZY_DISTRIBUTOR_PROGRAM_ID.toBase58(),
          instructionName: 'constructor',
        },
      ],
      null,
    ],
    [
      'an inherited program id',
      [{ programId: 'constructor', instructionName: 'name' }],
      null,
    ],
  ])('reads %s as UNKNOWN', async (_, instructions, summary) => {
    const item = withInstructions(instructions, summary)

    expect((await rowFor(REWARD_CLAIM, [item])).type).toBe('UNKNOWN')
  })

  it('reads an unnamed instruction of another program without its raw data', async () => {
    const item = withInstructions(
      [{ programId: TRANSFER_PROXY_PROGRAM_ID, rawData: '0OIl' }],
      { type: 'transfer' },
    )

    expect((await rowFor(REWARD_CLAIM, [item])).type).toBe('TRANSFER')
  })
})

describe('isReadableItem', () => {
  it('reads an item the parser failed on', () => {
    expect(
      isReadableItem({
        signature: REWARD_CLAIM,
        parserStatus: 'ERROR',
        parserError: 'could not parse',
      }),
    ).toBe(true)
  })
})

describe('toActivityRows', () => {
  it.each([
    [ONBOARDING, 'HOTSPOT_ONBOARDED'],
    [REWARD_CLAIM, 'CLAIM_REWARDS'],
    [CNFT_TRANSFER, 'COMPRESSED_NFT_TRANSFER'],
    [FAILED_RUN_TASK, 'UNKNOWN'],
  ])('renders %s as %s', async (signature, expected) => {
    expect(renderedType((await rowFor(signature)).type)).toBe(expected)
  })

  it('keeps the error of a failed transaction, so the row shows its signature', async () => {
    expect((await rowFor(FAILED_RUN_TASK)).transactionError).toEqual(
      enhancedBySignature.get(FAILED_RUN_TASK)?.transactionError,
    )
    expect((await rowFor(REWARD_CLAIM)).transactionError).toBeNull()
  })

  it.each([ONBOARDING, REWARD_CLAIM, CNFT_TRANSFER, FAILED_RUN_TASK])(
    'adapts %s to the fields Enhanced gave',
    async (signature) => {
      const row = await rowFor(signature)
      const before = enhancedBySignature.get(signature) as EnrichedTransaction

      expect(row.signature).toBe(before.signature)
      expect(row.timestamp).toBe(before.timestamp)
      expect(row.slot).toBe(before.slot)
      expect(row.fee).toBe(before.fee)
      expect(row.nativeTransfers).toEqual(before.nativeTransfers)
      expect(row.tokenTransfers).toMatchObject(
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

  it('attaches the signers of the same signature', async () => {
    expect((await rowFor(CNFT_TRANSFER)).signers).toEqual([
      `signer-of-${CNFT_TRANSFER}`,
    ])
  })

  it('shows a transaction the parser failed on as its bare signature row', async () => {
    const failed: ParsedEventsItem = {
      signature: REWARD_CLAIM,
      parserStatus: 'ERROR',
      parserError: 'could not parse',
    }

    const rows = await toActivityRows([failed], signatureRows)

    expect(rows.find((r) => r.signature === REWARD_CLAIM)).toEqual(
      signatureRows.find((sig) => sig.signature === REWARD_CLAIM),
    )
  })

  it('reads an undecoded Bubblegum v2 instruction from its discriminator', async () => {
    const bubblegumOnly = withoutProgram(
      itemFor(CNFT_TRANSFER),
      'transfer_proxy',
    )

    expect((await rowFor(CNFT_TRANSFER, [bubblegumOnly])).type).toBe(
      'COMPRESSED_NFT_TRANSFER',
    )
  })

  it('falls back to the summary type when no instruction matches', async () => {
    const noDistributor = withoutProgram(
      itemFor(REWARD_CLAIM),
      'lazy_distributor',
    )

    expect((await rowFor(REWARD_CLAIM, [noDistributor])).type).toBe('TRANSFER')
  })

  it('derives the asset id and owners of a transfer proxy cNFT transfer', async () => {
    const [compressed] = (await rowFor(CNFT_TRANSFER)).events.compressed ?? []
    const [before] =
      enhancedBySignature.get(CNFT_TRANSFER)?.events.compressed ?? []

    expect(compressed.assetId).toBe(
      'fJskYzT6u1pkvA33aVVw8zazNK8qZEqo462HZGcykQn',
    )
    expect(compressed).toMatchObject({
      assetId: before.assetId,
      treeId: before.treeId,
      leafIndex: before.leafIndex,
      oldLeafOwner: before.oldLeafOwner,
      newLeafOwner: before.newLeafOwner,
    })
  })

  it('gives no compressed event when the instructions give no asset id', async () => {
    const bubblegumOnly = withoutProgram(
      itemFor(CNFT_TRANSFER),
      'transfer_proxy',
    )

    expect(
      (await rowFor(CNFT_TRANSFER, [bubblegumOnly])).events.compressed,
    ).toBeUndefined()
    expect((await rowFor(ONBOARDING)).events.compressed).toBeUndefined()
  })

  it('derives the asset id and owners of a decoded Bubblegum transfer', async () => {
    const item = withBubblegumInstruction({
      instructionName: 'transfer',
      decoded: {
        args: { index: 248766 },
        accounts: [
          {
            name: 'merkle_tree',
            pubkey: '2PWRT3wGUpp7fes4CEDB46YfZcyw3nBihQk8YeubMQe9',
          },
          {
            name: 'leaf_owner',
            pubkey: 'ESJ4bn4FDKETrA9ZEkfmtgSqEnBQSc1VoEPRsXg2VCnA',
          },
          {
            name: 'new_leaf_owner',
            pubkey: 'HHYSHiAhevYkSUgwhoAQwVk9nybKzpT1VMMdo5yo6PQC',
          },
        ],
      },
    })

    const [compressed] =
      (await rowFor(CNFT_TRANSFER, [item])).events.compressed ?? []

    expect(compressed).toMatchObject({
      assetId: 'fJskYzT6u1pkvA33aVVw8zazNK8qZEqo462HZGcykQn',
      oldLeafOwner: 'ESJ4bn4FDKETrA9ZEkfmtgSqEnBQSc1VoEPRsXg2VCnA',
      newLeafOwner: 'HHYSHiAhevYkSUgwhoAQwVk9nybKzpT1VMMdo5yo6PQC',
    })
  })

  describe('with an item it cannot fully read', () => {
    // The cNFT transfer with its transfer_cnft decoded fields changed.
    const withTransferCnft = (
      patch: (
        decoded: NonNullable<ParsedInstruction['decoded']>,
      ) => NonNullable<ParsedInstruction['decoded']>,
    ) => {
      const item = itemFor(CNFT_TRANSFER)
      if (item.parserStatus !== 'OK') throw new Error('expected an OK item')
      return {
        ...item,
        parsed: {
          ...item.parsed,
          instructions: item.parsed.instructions.map((ix) =>
            ix.instructionName === 'transfer_cnft' && ix.decoded
              ? { ...ix, decoded: patch(ix.decoded) }
              : ix,
          ),
        },
      }
    }

    const replacing = (replacement: unknown) =>
      items.map((item) =>
        item.signature === CNFT_TRANSFER ? replacement : item,
      ) as ParsedEventsItem[]

    it.each([
      [
        'no merkle_tree',
        withTransferCnft((decoded) => ({
          ...decoded,
          accounts: decoded.accounts.filter(
            (acc) => acc.name !== 'merkle_tree',
          ),
        })),
      ],
      [
        'no leaf_index',
        withTransferCnft(({ args: { leaf_index: _, ...args }, accounts }) => ({
          args,
          accounts,
        })),
      ],
    ])('keeps a transfer_cnft with %s, without its asset', async (_, item) => {
      const rows = await toActivityRows(replacing(item), signatureRows)
      const row = rows.find(
        (r) => r.signature === CNFT_TRANSFER,
      ) as EnrichedTransaction

      expect(rows).toHaveLength(items.length)
      expect(row.type).toBe('COMPRESSED_NFT_TRANSFER')
      expect(row.events.compressed).toBeUndefined()
    })

    const bareRowOf = (signature: string) =>
      signatureRows.find((sig) => sig.signature === signature)

    // The reward claim with its parsed transaction changed by `patch`.
    const withParsed = (
      patch: (parsed: Record<string, unknown>) => Record<string, unknown>,
    ) => {
      const item = itemFor(REWARD_CLAIM)
      if (item.parserStatus !== 'OK') throw new Error('expected an OK item')
      return { ...item, parsed: patch(item.parsed) }
    }

    it('keeps the bare signature row of a signature the response omits', async () => {
      const rows = await toActivityRows(
        items.filter((item) => item.signature !== CNFT_TRANSFER),
        signatureRows,
      )

      expect(rows).toHaveLength(items.length)
      expect(rows.find((r) => r.signature === CNFT_TRANSFER)).toEqual(
        bareRowOf(CNFT_TRANSFER),
      )
    })

    it('shows a non-array response as the bare signature rows', async () => {
      expect(
        await toActivityRows({ error: 'bad gateway' }, signatureRows),
      ).toEqual(signatureRows)
    })

    it.each([
      [
        'a null token transfer',
        replacing({
          ...itemFor(CNFT_TRANSFER),
          parsed: {
            ...(itemFor(CNFT_TRANSFER) as { parsed: object }).parsed,
            tokenTransfers: [null],
          },
        }),
      ],
      [
        'an undecoded Bubblegum instruction with invalid base58',
        replacing(
          withBubblegumInstruction({ instructionName: null, rawData: '0OIl' }),
        ),
      ],
      [
        'a parser status other than OK',
        replacing({ ...itemFor(CNFT_TRANSFER), parserStatus: 'PENDING' }),
      ],
    ])('shows an item with %s as its bare signature row', async (_, from) => {
      const rows = await toActivityRows(from, signatureRows)

      expect(rows).toHaveLength(items.length)
      expect(rows.find((r) => r.signature === CNFT_TRANSFER)).toEqual(
        bareRowOf(CNFT_TRANSFER),
      )
      expect(
        (rows.find((r) => r.signature === REWARD_CLAIM) as EnrichedTransaction)
          .type,
      ).toBe('CLAIM_REWARDS')
    })

    it('gives a token transfer without a raw amount no amount', async () => {
      const item = withParsed((parsed) => ({
        ...parsed,
        tokenTransfers: (
          parsed.tokenTransfers as Record<string, unknown>[]
        ).map(({ rawTokenAmount: _, ...transfer }) => transfer),
      }))
      const row = await rowFor(REWARD_CLAIM, [item as ParsedEventsItem])
      const withSymbol = {
        ...row,
        type: 'TRANSFER',
        tokenTransfers: row.tokenTransfers.map((transfer) => ({
          ...transfer,
          tokenMetadata: { symbol: 'HNT' },
        })),
      } as EnrichedTransaction

      expect(row.tokenTransfers[0].tokenAmount).not.toBeNaN()
      expect(
        describeActivity(
          withSymbol,
          'BmfPk1dpkv4dFzsAezoZhqWDW5DozG5sbzSNexABsVhN',
          i18n.t,
        ),
      ).toBe('')
    })

    it.each([undefined, null, -1, 2.5])(
      'gives a token transfer with decimals %p no amount',
      async (decimals) => {
        const item = withParsed((parsed) => ({
          ...parsed,
          tokenTransfers: (
            parsed.tokenTransfers as Record<string, unknown>[]
          ).map((transfer) => ({ ...transfer, decimals })),
        }))
        const row = await rowFor(REWARD_CLAIM, [item as ParsedEventsItem])
        const withSymbol = {
          ...row,
          type: 'TRANSFER',
          tokenTransfers: row.tokenTransfers.map((transfer) => ({
            ...transfer,
            tokenMetadata: { symbol: 'HNT' },
          })),
        } as EnrichedTransaction

        expect(row.tokenTransfers[0].decimals).toBeUndefined()
        expect(
          describeActivity(
            withSymbol,
            'BmfPk1dpkv4dFzsAezoZhqWDW5DozG5sbzSNexABsVhN',
            i18n.t,
          ),
        ).toBe('')
      },
    )

    it('takes the time of the signature row when the item has none', async () => {
      const item = withParsed(({ blockTime: _, ...parsed }) => parsed)

      expect(
        (await rowFor(REWARD_CLAIM, [item as ParsedEventsItem])).timestamp,
      ).toBe(bareRowOf(REWARD_CLAIM)?.blockTime)
    })

    it('takes the error of the signature row when the item has none', async () => {
      const err = { InstructionError: [2, { Custom: 3012 }] }
      const item = withParsed(({ error: _, ...parsed }) => parsed)
      const failedRows = signatureRows.map((row) =>
        row.signature === REWARD_CLAIM ? { ...row, err } : row,
      )

      const rows = await toActivityRows([item], failedRows)

      expect(
        (rows.find((r) => r.signature === REWARD_CLAIM) as EnrichedTransaction)
          .transactionError,
      ).toEqual(err)
    })

    it.each([[''], [false], [0]])(
      'takes the error of the signature row when the item error is %p',
      async (error) => {
        const err = { InstructionError: [2, { Custom: 3012 }] }
        const item = withParsed((parsed) => ({ ...parsed, error }))
        const failedRows = signatureRows.map((row) =>
          row.signature === REWARD_CLAIM ? { ...row, err } : row,
        )

        const rows = await toActivityRows([item], failedRows)

        expect(
          (
            rows.find(
              (r) => r.signature === REWARD_CLAIM,
            ) as EnrichedTransaction
          ).transactionError,
        ).toEqual(err)
      },
    )

    it.each(['instructions', 'nativeTransfers', 'tokenTransfers'])(
      // toActivityRows also catches the throw, so check the guard itself.
      'does not read an item without a %s array',
      (field) => {
        const item = withParsed((parsed) => ({ ...parsed, [field]: {} }))

        expect(isReadableItem(item)).toBe(false)
      },
    )

    it.each([
      [
        'a negative leaf index',
        withTransferCnft((decoded) => ({
          ...decoded,
          args: { ...decoded.args, leaf_index: -1 },
        })),
      ],
      [
        'a fractional leaf index',
        withTransferCnft((decoded) => ({
          ...decoded,
          args: { ...decoded.args, leaf_index: 2.5 },
        })),
      ],
      [
        'an empty leaf index',
        withTransferCnft((decoded) => ({
          ...decoded,
          args: { ...decoded.args, leaf_index: '' },
        })),
      ],
      [
        'a boolean leaf index',
        withTransferCnft((decoded) => ({
          ...decoded,
          args: { ...decoded.args, leaf_index: true },
        })),
      ],
      [
        'a tree that is not a string',
        withTransferCnft((decoded) => ({
          ...decoded,
          accounts: decoded.accounts.map((acc) =>
            acc.name === 'merkle_tree'
              ? { ...acc, pubkey: 7 as unknown as string }
              : acc,
          ),
        })),
      ],
      [
        'a tree that is not base58',
        withTransferCnft((decoded) => ({
          ...decoded,
          accounts: decoded.accounts.map((acc) =>
            acc.name === 'merkle_tree' ? { ...acc, pubkey: '0OIl' } : acc,
          ),
        })),
      ],
      [
        'no args',
        withTransferCnft((decoded) => ({
          ...decoded,
          args: null as unknown as Record<string, unknown>,
        })),
      ],
      [
        'no accounts',
        withTransferCnft((decoded) => ({
          ...decoded,
          accounts: null as unknown as typeof decoded.accounts,
        })),
      ],
    ])('keeps a transfer_cnft with %s, without its asset', async (_, item) => {
      const rows = await toActivityRows(replacing(item), signatureRows)
      const row = rows.find(
        (r) => r.signature === CNFT_TRANSFER,
      ) as EnrichedTransaction

      expect(row.type).toBe('COMPRESSED_NFT_TRANSFER')
      expect(row.events.compressed).toBeUndefined()
    })

    it('shows a malformed item as its bare signature row', async () => {
      const garbage = {
        signature: CNFT_TRANSFER,
        parserStatus: 'OK',
        parsed: { instructions: 'garbage' },
      }

      const rows = await toActivityRows(replacing(garbage), signatureRows)

      expect(rows).toHaveLength(items.length)
      expect(rows.find((r) => r.signature === CNFT_TRANSFER)).toEqual(
        signatureRows.find((sig) => sig.signature === CNFT_TRANSFER),
      )
    })
  })
})
