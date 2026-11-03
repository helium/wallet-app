import i18next from 'i18next'
import en from '../../../../locales/en'
import { EnrichedTransaction } from '../../../../types/solana'
import { describeActivity } from '../describeActivity'
import { ParsedEventsItem, toActivityRows } from '../parsedEvents'
import parsedEvents from './fixtures/v1.json'
import parsedEventsFailed from './fixtures/v1-failed.json'

const i18n = i18next.createInstance()
i18n.init({ lng: 'en', resources: { en: { translation: en } } })

const ONBOARDING =
  '2esPnpkCMWYfop4dzgswQNV68Z6iZphSf5rApAp9nfZoLURydFySqJGouUo2z2BtCEno4ifiqZSKPhUttc864jWY'
const REWARD_CLAIM =
  '5kjuCwQUGQapVDwtf7L2ZgCxBs2bS5iKJMF17oVzLCYDbnCHBT93Bg57B61RgYhN6bBrUMREeWW9MABtm4V4JUhQ'
const CNFT_TRANSFER =
  '3qCKo3qy2J1BgQoTwDfVDyyTidFm6WGACAtnuVXFFyCEfurG7Ae9cxt6z7qJa2FLqMea4GN2NqQ2ywnoKnmkoqMU'
const FAILED_RUN_TASK =
  '53bmbS7T2B15WSZRmgUPmHkavw31aDzwEFz1xAiJ5rneEiiJbp4j5cH5HLXrsi9gyk5NnLnvx5R18Xg786E6oWMF'

const REWARD_SENDER = '73zsmmqCXjvHHhNSib26Y8p3jYiH3UUuyKv71RJDnctW'
const REWARD_RECIPIENT = 'BmfPk1dpkv4dFzsAezoZhqWDW5DozG5sbzSNexABsVhN'
const CNFT_OLD_OWNER = 'ESJ4bn4FDKETrA9ZEkfmtgSqEnBQSc1VoEPRsXg2VCnA'
const CNFT_NEW_OWNER = 'HHYSHiAhevYkSUgwhoAQwVk9nybKzpT1VMMdo5yo6PQC'

const items = [
  ...parsedEvents,
  ...parsedEventsFailed,
] as unknown as ParsedEventsItem[]

const rowFor = async (signature: string) =>
  (await toActivityRows(items, [])).find(
    (row) => row.signature === signature,
  ) as EnrichedTransaction

// The token metadata getAllTransactions adds before it describes a row.
const withHntMetadata = (tx: EnrichedTransaction): EnrichedTransaction => ({
  ...tx,
  tokenTransfers: tx.tokenTransfers.map((transfer) => ({
    ...transfer,
    tokenMetadata: {
      model: 'token',
      name: 'Helium Network Token',
      symbol: 'HNT',
      uri: '',
      json: undefined,
    },
  })),
})

const describeFor = (tx: EnrichedTransaction, wallet: string) =>
  describeActivity(tx, wallet, i18n.t)

describe('describeActivity', () => {
  it('describes a reward claim with the claimed amount', async () => {
    const tx = withHntMetadata(await rowFor(REWARD_CLAIM))

    expect(describeFor(tx, REWARD_RECIPIENT)).toBe('Claimed 0.57264314 HNT')
  })

  it('describes a fungible transfer as sent or received for the wallet', async () => {
    const tx = {
      ...withHntMetadata(await rowFor(REWARD_CLAIM)),
      type: 'TRANSFER',
    }

    expect(describeFor(tx, REWARD_SENDER)).toBe('Sent 0.57264314 HNT')
    expect(describeFor(tx, REWARD_RECIPIENT)).toBe('Received 0.57264314 HNT')
  })

  it('gives a transfer without a token symbol no description', async () => {
    const tx = { ...(await rowFor(REWARD_CLAIM)), type: 'TRANSFER' }

    expect(describeFor(tx, REWARD_SENDER)).toBe('')
  })

  it('describes a hotspot onboarding', async () => {
    expect(describeFor(await rowFor(ONBOARDING), REWARD_SENDER)).toBe(
      'Hotspot onboarded',
    )
  })

  it('names a cNFT transfer without metadata Compressed NFT', async () => {
    const tx = await rowFor(CNFT_TRANSFER)

    expect(describeFor(tx, CNFT_OLD_OWNER)).toBe('Sent Compressed NFT')
    expect(describeFor(tx, CNFT_NEW_OWNER)).toBe('Received Compressed NFT')
  })

  it('names a cNFT transfer from its metadata', async () => {
    const tx = await rowFor(CNFT_TRANSFER)
    const [compressed] = tx.events.compressed ?? []
    const withMetadata = {
      ...tx,
      events: {
        compressed: [{ ...compressed, metadata: { name: 'Hotspot Moon' } }],
      },
    }

    expect(describeFor(withMetadata, CNFT_NEW_OWNER)).toBe(
      'Received Hotspot Moon',
    )
  })

  it('keeps the mint string for a cNFT mint', async () => {
    const tx = await rowFor(CNFT_TRANSFER)
    const [compressed] = tx.events.compressed ?? []
    const mint = {
      ...tx,
      type: 'COMPRESSED_NFT_MINT',
      events: {
        compressed: [{ ...compressed, metadata: { symbol: 'IOT' } }],
      },
    }

    expect(describeFor(mint, CNFT_OLD_OWNER)).toBe('Minted 1 iot(s).')
  })

  it('describes a cNFT mint without metadata generically', async () => {
    const tx = await rowFor(CNFT_TRANSFER)
    const mint = { ...tx, type: 'COMPRESSED_NFT_MINT', events: {} }

    expect(describeFor(mint, CNFT_OLD_OWNER)).toBe('Minted a compressed NFT')
  })

  it('gives other types no description', async () => {
    expect(describeFor(await rowFor(FAILED_RUN_TASK), REWARD_SENDER)).toBe('')
  })

  it('writes a 1 lamport transfer without exponent form', async () => {
    const tx = {
      ...(await rowFor(REWARD_CLAIM)),
      type: 'TRANSFER',
      tokenTransfers: [],
      nativeTransfers: [
        {
          fromUserAccount: REWARD_SENDER,
          toUserAccount: REWARD_RECIPIENT,
          amount: 1,
        },
      ],
    }

    expect(describeFor(tx, REWARD_RECIPIENT)).toBe('Received 0.000000001 SOL')
  })

  it('never describes a SOL transfer as claimed rewards', async () => {
    const tx = {
      ...(await rowFor(REWARD_CLAIM)),
      tokenTransfers: [],
      nativeTransfers: [
        {
          fromUserAccount: REWARD_SENDER,
          toUserAccount: REWARD_RECIPIENT,
          amount: 1706880,
        },
      ],
    }

    expect(describeFor(tx, REWARD_RECIPIENT)).toBe('')
  })
})
