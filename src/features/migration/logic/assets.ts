import {
  deriveVisibleMints,
  isNftLike,
} from '../../account/logic/visibleTokens'
import { rawToUi } from './amounts'
import { WSOL_MINT } from './mints'
import { HoldingsClassification, SelectableToken, WalletHolding } from './types'

// Local (not @utils/formatting's shortenAddress): logic/ runs under node-jest,
// and that module's import chain drags react-native-localize, which the node
// test env can't load. Shared by the token-label fallback and the flow's
// review lines so mint truncation has one shape.
export const shortenMint = (mint: string): string =>
  `${mint.slice(0, 4)}…${mint.slice(-4)}`

// True once assets have loaded and the wallet holds nothing migratable — the
// flow short-circuits to the "nothing to migrate" screen. Guards on !loading so
// an empty in-flight snapshot doesn't read as a done wallet.
export const nothingToMigrate = (
  loading: boolean,
  hotspots: unknown[],
  tokens: unknown[],
): boolean => !loading && hotspots.length === 0 && tokens.length === 0

const solToSelectable = (solLamports: bigint | number): SelectableToken => ({
  mint: WSOL_MINT,
  label: 'SOL',
  decimals: 9,
  maxUi: rawToUi(String(solLamports), 9),
})

// Holdings carry no metadata, so the label is only ever the fallback; the token
// rows and review lines resolve symbol/name from the metadata hook on top.
const holdingToSelectable = (h: WalletHolding): SelectableToken => ({
  mint: h.mint,
  label: shortenMint(h.mint),
  decimals: h.decimals,
  maxUi: rawToUi(String(h.balance), h.decimals),
})

export const classifyHoldings = (args: {
  holdings: WalletHolding[]
  visibleTokens: ReadonlySet<string>
  solLamports: bigint | number
}): HoldingsClassification => {
  const { holdings, visibleTokens, solLamports } = args

  // tokenAccounts includes NFT ATAs, which aren't tokens and belong in neither
  // the offer nor the warning.
  const fungible = holdings.filter((h) => h.balance > 0 && !isNftLike(h))

  // Same derivation the account token list uses, so the flow offers exactly the
  // tokens the user already sees. It orders network tokens first.
  const visibleMints = deriveVisibleMints({
    tokenAccounts: holdings,
    visibleTokens,
  })
  const byMint = new Map(fungible.map((h) => [h.mint, h]))

  const migratableTokens: SelectableToken[] = [
    ...(solLamports > 0 ? [solToSelectable(solLamports)] : []),
    // The native SOL row already occupies the WSOL mint key.
    ...visibleMints
      .filter((mint) => mint !== WSOL_MINT)
      .flatMap((mint) => {
        const holding = byMint.get(mint)
        return holding && !holding.frozen ? [holdingToSelectable(holding)] : []
      }),
  ]

  // A wrapped-SOL ATA is also left behind: the server reads the WSOL mint as
  // native SOL, so the ATA balance cannot move through this endpoint.
  const visible = new Set(visibleMints)
  const leftBehindMints = Array.from(
    new Set(
      fungible
        .filter((h) => h.frozen || h.mint === WSOL_MINT || !visible.has(h.mint))
        .map((h) => h.mint),
    ),
  )

  return { migratableTokens, leftBehindMints }
}
