import i18next from 'i18next'
import en from '../../../../locales/en'
import { EnrichedTransaction } from '../../../../types/solana'
import { describeActivity } from '../describeActivity'
import { ParsedEventsItem, toActivityRows } from '../parsedEvents'
import parsedEvents from './fixtures/v1.json'
import parsedEventsFailed from './fixtures/v1-failed.json'
import parsedEventsSwaps from './fixtures/v1-swaps.json'

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

// Real swaps, with the wallet that made each one.
const HNT_TO_USDC = {
  signature:
    '4P4kAhBNwQcHpvbKjuccHmi3dK65u3cbKzmdWGt2nhwC4tuYVVSPGYdnJe1BwZcdC42CbLK3C438hut5yzv7ovf6',
  wallet: 'A5bi3PZyZmYU1etx7pUrqpYcuyETXri7YZfDDufCRRXL',
}
const IOT_TO_HNT = {
  signature:
    '4stoou7gMw5E5PV7PsKKm1h5uD8Hb1QTdgDKyAL6ssf2v9nyJqikXec8VdGzQM8Rtovzxndb1V1A2Y2sBuDnskuE',
  wallet: '7ohvcCZdvBVPuxwq5sq72mXLsGwezT9gZ9qysrk9KPF5',
}
// The SOL comes back as wSOL, and closing the wSOL account also shows as a
// native transfer.
const USDC_TO_WSOL = {
  signature:
    '5a1QyxmBhYhzVKkASPZpTRHmEPwMxkL6xFsozFBwicVKiwwkb1KUccFjU6TpXqaJTq7CxBnHNqCFXoGenXeskkTR',
  wallet: '7zFm9DkzDmavep2Q4NhtBmHJqvFNWLcKFZBZeVroHDSj',
}
// A sponsor pays the fee and the wallet gets native SOL.
const SPONSORED_HNT_TO_SOL = {
  signature:
    '2FpnHSEuiFrXwtrXj3t88RNGKZzuWqkXGTomaxeXokm8wUpFjBAtG6ViKKCD6Tf8fyR6anKpw6QDCEhWcyYqEMdg',
  wallet: '9rpEZ1V65CDveR2Z4JCucHd9ecqo1R3CTWWcUNiXjcM5',
  sponsor: 'ALVMJ9bny8tFT7AapoVbbzrgCYzrjy8iHw6EHFaehgZZ',
}
// A bot route that starts and ends in SOL.
const ARBITRAGE = {
  signature:
    '2iBqNKUkimi5bUWLnk7YzjVFqT7Zu31mpkYyhkBUaoingxNxaKH1iB5hiWdapyZYSASxQn7vYiT93QpYYx5c4zMD',
  wallet: '3yZVBT1EJdoFJUShFmb1B6cJS1K7x5NpZjjEKGwa6NjL',
}
const UNKNOWN_MINT_TO_SOL = {
  signature:
    '65FFh7t5oTbLdoANezkHubbMGj5rs6MagmBGkHoTvWzrnrwxcmZpV3WW1aRV1t1m7JN6eUoweF42Ft7rsUbuw739',
  wallet: 'CAU4LpPbcWfuW7FRaFKF5n2UDYkw2wGoXMSWQsBtanjK',
}

const items = [
  ...parsedEvents,
  ...parsedEventsFailed,
  ...parsedEventsSwaps,
] as unknown as ParsedEventsItem[]

// Signature rows the wallet signed none of.
const signatureRows = items.map(({ signature }) => ({
  signature,
  slot: 1,
  err: null,
  memo: null,
  blockTime: 1,
  signers: [],
}))

const rowFor = async (signature: string) =>
  (await toActivityRows(items, signatureRows)).find(
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

// An amount as the current locale writes it, so the tests pass in any locale.
const amountOf = (amount: number, maximumFractionDigits: number) =>
  amount.toLocaleString(undefined, { maximumFractionDigits })

const LAMPORTS = 1e9

describe('describeActivity', () => {
  it('describes a reward claim with the claimed amount', async () => {
    const tx = withHntMetadata(await rowFor(REWARD_CLAIM))

    expect(describeFor(tx, REWARD_RECIPIENT)).toBe(
      `Claimed ${amountOf(0.57264314, 8)} HNT`,
    )
  })

  it('describes a fungible transfer as sent or received for the wallet', async () => {
    const tx = {
      ...withHntMetadata(await rowFor(REWARD_CLAIM)),
      type: 'TRANSFER',
    }

    expect(describeFor(tx, REWARD_SENDER)).toBe(
      `Sent ${amountOf(0.57264314, 8)} HNT to ${REWARD_RECIPIENT}`,
    )
    expect(describeFor(tx, REWARD_RECIPIENT)).toBe(
      `Received ${amountOf(0.57264314, 8)} HNT from ${REWARD_SENDER}`,
    )
  })

  it('describes a token transfer with no destination as burned', async () => {
    const tx = withHntMetadata(await rowFor(REWARD_CLAIM))
    const [reward] = tx.tokenTransfers
    const burn = { ...reward, toUserAccount: '' }
    const burnTx = { ...tx, type: 'TRANSFER', tokenTransfers: [burn, burn] }

    expect(describeFor(burnTx, REWARD_SENDER)).toBe(
      `Burned ${amountOf(reward.tokenAmount + reward.tokenAmount, 8)} HNT`,
    )
  })

  it('gives a burn mixed with a send of the wallet no description', async () => {
    const tx = withHntMetadata(await rowFor(REWARD_CLAIM))
    const [reward] = tx.tokenTransfers
    const burn = { ...reward, toUserAccount: '' }

    expect(
      describeFor(
        { ...tx, type: 'TRANSFER', tokenTransfers: [reward, burn] },
        REWARD_SENDER,
      ),
    ).toBe('')
    expect(
      describeFor(
        { ...tx, type: 'TRANSFER', tokenTransfers: [burn, reward] },
        REWARD_SENDER,
      ),
    ).toBe('')
  })

  it('sums every reward transfer of a claim', async () => {
    const tx = withHntMetadata(await rowFor(REWARD_CLAIM))
    const [reward] = tx.tokenTransfers
    const twoRewards = { ...tx, tokenTransfers: [reward, reward] }

    expect(describeFor(twoRewards, REWARD_RECIPIENT)).toBe(
      `Claimed ${amountOf(reward.tokenAmount + reward.tokenAmount, 8)} HNT`,
    )
  })

  it('takes the symbol from the mint, without token metadata', async () => {
    expect(describeFor(await rowFor(REWARD_CLAIM), REWARD_RECIPIENT)).toBe(
      `Claimed ${amountOf(0.57264314, 8)} HNT`,
    )
  })

  it('sums a SOL send to several payees and names no payee', async () => {
    const tx = {
      ...(await rowFor(REWARD_CLAIM)),
      type: 'TRANSFER',
      tokenTransfers: [],
      nativeTransfers: [1, 2, 3].map((sol, i) => ({
        fromUserAccount: REWARD_SENDER,
        toUserAccount: [REWARD_RECIPIENT, CNFT_OLD_OWNER, CNFT_NEW_OWNER][i],
        amount: sol * LAMPORTS,
      })),
    }

    expect(describeFor(tx, REWARD_SENDER)).toBe(`Sent ${amountOf(6, 9)} SOL`)
  })

  it('gives SOL transfers in both directions for the wallet no description', async () => {
    const tx = {
      ...(await rowFor(REWARD_CLAIM)),
      type: 'TRANSFER',
      tokenTransfers: [],
      nativeTransfers: [
        {
          fromUserAccount: REWARD_SENDER,
          toUserAccount: REWARD_RECIPIENT,
          amount: LAMPORTS,
        },
        {
          fromUserAccount: REWARD_RECIPIENT,
          toUserAccount: REWARD_SENDER,
          amount: LAMPORTS,
        },
      ],
    }

    expect(describeFor(tx, REWARD_SENDER)).toBe('')
  })

  it('gives a SOL transfer whose amount is not a number no description', async () => {
    const tx = {
      ...(await rowFor(REWARD_CLAIM)),
      type: 'TRANSFER',
      tokenTransfers: [],
      nativeTransfers: [
        {
          fromUserAccount: REWARD_SENDER,
          toUserAccount: REWARD_RECIPIENT,
          amount: NaN,
        },
      ],
    }

    expect(describeFor(tx, REWARD_SENDER)).toBe('')
  })

  it('gives token transfers in both directions for the wallet no description', async () => {
    const tx = withHntMetadata(await rowFor(REWARD_CLAIM))
    const [reward] = tx.tokenTransfers
    const bothWays = {
      ...tx,
      type: 'TRANSFER',
      tokenTransfers: [
        reward,
        {
          ...reward,
          fromUserAccount: REWARD_RECIPIENT,
          toUserAccount: REWARD_SENDER,
        },
      ],
    }

    expect(describeFor(bothWays, REWARD_RECIPIENT)).toBe('')
  })

  it('gives token transfers of different mints for the wallet no description', async () => {
    const tx = withHntMetadata(await rowFor(REWARD_CLAIM))
    const [reward] = tx.tokenTransfers
    const twoMints = {
      ...tx,
      type: 'TRANSFER',
      tokenTransfers: [
        reward,
        { ...reward, mint: 'mb1eu7TzEc71KxDpsmsKoucSSuuoGLv1drys1oP2jh6' },
      ],
    }

    expect(describeFor(twoMints, REWARD_RECIPIENT)).toBe('')
  })

  it('gives token transfers of different decimals for the wallet no description', async () => {
    const tx = withHntMetadata(await rowFor(REWARD_CLAIM))
    const [reward] = tx.tokenTransfers
    const twoDecimals = {
      ...tx,
      type: 'TRANSFER',
      tokenTransfers: [reward, { ...reward, decimals: undefined }],
    }

    expect(describeFor(twoDecimals, REWARD_RECIPIENT)).toBe('')
  })

  it('gives a mint outside the default tokens no symbol, whatever its metadata says', async () => {
    const tx = withHntMetadata(await rowFor(REWARD_CLAIM))
    const spoof = {
      ...tx,
      type: 'TRANSFER',
      tokenTransfers: tx.tokenTransfers.map((transfer) => ({
        ...transfer,
        mint: CNFT_OLD_OWNER,
      })),
    }

    expect(describeFor(spoof, REWARD_RECIPIENT)).toBe('')
  })

  it('gives a transfer with no transfer of the wallet no description', async () => {
    const tx = {
      ...(await rowFor(REWARD_CLAIM)),
      type: 'TRANSFER',
      tokenTransfers: [],
      nativeTransfers: [
        {
          fromUserAccount: CNFT_OLD_OWNER,
          toUserAccount: CNFT_NEW_OWNER,
          amount: LAMPORTS,
        },
      ],
    }

    expect(describeFor(tx, REWARD_SENDER)).toBe('')
  })

  it('describes a cNFT transfer with no known source as sent only by its signer', async () => {
    const tx = await rowFor(CNFT_TRANSFER)
    const [compressed] = tx.events.compressed ?? []
    const signed = { ...tx, signers: [CNFT_NEW_OWNER] }
    const noSource = {
      ...signed,
      events: {
        compressed: [
          { ...compressed, oldLeafOwner: '', newLeafOwner: REWARD_RECIPIENT },
        ],
      },
    }
    const otherSource = {
      ...signed,
      events: {
        compressed: [
          {
            ...compressed,
            oldLeafOwner: REWARD_SENDER,
            newLeafOwner: REWARD_RECIPIENT,
          },
        ],
      },
    }

    expect(describeFor(noSource, CNFT_NEW_OWNER)).toBe('Sent Compressed NFT')
    expect(describeFor(otherSource, CNFT_NEW_OWNER)).toBe('')
  })

  it('gives a token transfer between other wallets no description', async () => {
    const tx = {
      ...withHntMetadata(await rowFor(REWARD_CLAIM)),
      type: 'TRANSFER',
    }

    expect(describeFor(tx, CNFT_OLD_OWNER)).toBe('')
  })

  it('describes the SOL transfer of the wallet over a token transfer between other wallets', async () => {
    const tx = {
      ...withHntMetadata(await rowFor(REWARD_CLAIM)),
      type: 'TRANSFER',
      nativeTransfers: [
        {
          fromUserAccount: CNFT_NEW_OWNER,
          toUserAccount: CNFT_OLD_OWNER,
          amount: 1,
        },
      ],
    }

    expect(describeFor(tx, CNFT_OLD_OWNER)).toBe(
      `Received ${amountOf(0.000000001, 9)} SOL from ${CNFT_NEW_OWNER}`,
    )
  })

  it('gives a cNFT transfer between other wallets no description', async () => {
    expect(describeFor(await rowFor(CNFT_TRANSFER), REWARD_SENDER)).toBe('')
  })

  it('gives a cNFT transfer with no known source no description when the wallet did not sign', async () => {
    const tx = { ...(await rowFor(CNFT_TRANSFER)), events: {} }

    expect(describeFor(tx, CNFT_NEW_OWNER)).toBe('')
  })

  it('describes a SOL transfer from the transfer of the wallet', async () => {
    const tx = {
      ...(await rowFor(REWARD_CLAIM)),
      type: 'TRANSFER',
      tokenTransfers: [],
      nativeTransfers: [
        {
          fromUserAccount: CNFT_OLD_OWNER,
          toUserAccount: CNFT_NEW_OWNER,
          amount: 5000,
        },
        {
          fromUserAccount: REWARD_SENDER,
          toUserAccount: REWARD_RECIPIENT,
          amount: 1,
        },
      ],
    }

    expect(describeFor(tx, REWARD_SENDER)).toBe(
      `Sent ${amountOf(0.000000001, 9)} SOL to ${REWARD_RECIPIENT}`,
    )
  })

  it('gives a transfer whose wallet token transfer has no decimals no description', async () => {
    const tx = {
      ...withHntMetadata(await rowFor(REWARD_CLAIM)),
      type: 'TRANSFER',
    }
    const unreadable = {
      ...tx,
      tokenTransfers: tx.tokenTransfers.map((transfer) => ({
        ...transfer,
        decimals: undefined,
      })),
      nativeTransfers: [
        {
          fromUserAccount: REWARD_SENDER,
          toUserAccount: CNFT_OLD_OWNER,
          amount: 2039280,
        },
      ],
    }

    expect(describeFor(unreadable, REWARD_SENDER)).toBe('')
  })

  it.each([
    ['cNFT transfer', CNFT_TRANSFER, CNFT_OLD_OWNER],
    ['hotspot onboarding', ONBOARDING, REWARD_SENDER],
  ])('gives a failed %s no description', async (_, signature, wallet) => {
    const tx = {
      ...(await rowFor(signature)),
      transactionError: { InstructionError: [0, { Custom: 1 }] },
    }

    expect(describeFor(tx, wallet)).toBe('')
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

  it.each([['Received 1,000 HNT. Claim it at scam.example'], [{ en: 'x' }]])(
    'never names a cNFT transfer from its metadata name %p',
    async (name) => {
      const tx = await rowFor(CNFT_TRANSFER)
      const [compressed] = tx.events.compressed ?? []
      const withMetadata = {
        ...tx,
        events: { compressed: [{ ...compressed, metadata: { name } }] },
      }

      expect(describeFor(withMetadata, CNFT_NEW_OWNER)).toBe(
        'Received Compressed NFT',
      )
      expect(describeFor(withMetadata, CNFT_OLD_OWNER)).toBe(
        'Sent Compressed NFT',
      )
    },
  )

  it('describes a cNFT mint whose symbol is not a string generically', async () => {
    const tx = await rowFor(CNFT_TRANSFER)
    const [compressed] = tx.events.compressed ?? []
    const mint = {
      ...tx,
      type: 'COMPRESSED_NFT_MINT',
      events: { compressed: [{ ...compressed, metadata: { symbol: 42 } }] },
    }

    expect(describeFor(mint, CNFT_OLD_OWNER)).toBe('Minted a compressed NFT')
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

  describe('swaps', () => {
    const describeSwap = async ({
      signature,
      wallet,
    }: {
      signature: string
      wallet: string
    }) => describeFor(await rowFor(signature), wallet)

    it.each([
      [
        HNT_TO_USDC,
        `Swapped ${amountOf(5, 8)} HNT for ${amountOf(1.253699, 6)} USDC`,
      ],
      [
        IOT_TO_HNT,
        `Swapped ${amountOf(18454.591776, 6)} IOT for ${amountOf(
          2.79267603,
          8,
        )} HNT`,
      ],
    ])('describes what the wallet spent and got', async (swap, expected) => {
      expect(await describeSwap(swap)).toBe(expected)
    })

    it('counts SOL that comes back as wSOL once', async () => {
      expect(await describeSwap(USDC_TO_WSOL)).toBe(
        `Swapped ${amountOf(0.465288, 6)} USDC for ${amountOf(
          0.005572562,
          9,
        )} SOL`,
      )
    })

    it('reads native SOL out of a sponsored swap for the wallet, not the sponsor', async () => {
      expect(await describeSwap(SPONSORED_HNT_TO_SOL)).toBe(
        `Swapped ${amountOf(25.25798087, 8)} HNT for ${amountOf(
          0.075247653,
          9,
        )} SOL`,
      )
      expect(
        await describeSwap({
          ...SPONSORED_HNT_TO_SOL,
          wallet: SPONSORED_HNT_TO_SOL.sponsor,
        }),
      ).toBe('')
    })

    it('gives a route that spends nothing net no description', async () => {
      expect(await describeSwap(ARBITRAGE)).toBe('')
    })

    it('gives a swap of a mint outside the default tokens no description', async () => {
      expect(await describeSwap(UNKNOWN_MINT_TO_SOL)).toBe('')
    })

    it('gives a failed swap no description', async () => {
      const tx = {
        ...(await rowFor(HNT_TO_USDC.signature)),
        transactionError: { InstructionError: [0, { Custom: 1 }] },
      }

      expect(describeFor(tx, HNT_TO_USDC.wallet)).toBe('')
    })
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

    expect(describeFor(tx, REWARD_RECIPIENT)).toBe(
      `Received ${amountOf(0.000000001, 9)} SOL from ${REWARD_SENDER}`,
    )
    expect(describeFor(tx, REWARD_RECIPIENT)).not.toMatch(/e-/)
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
