import { rawToUi } from './amounts'
import { MIGRATABLE_MINTS, WSOL_MINT } from './mints'
import {
  HoldingsClassification,
  MigratableToken,
  SelectableToken,
  WalletHolding,
} from './types'

// Local (not @utils/formatting's shortenAddress): logic/ runs under node-jest,
// and that module's import chain drags react-native-localize, which the node
// test env can't load. Shared by the token-label fallback and the flow's
// review lines so mint truncation has one shape.
export const shortenMint = (mint: string): string =>
  `${mint.slice(0, 4)}…${mint.slice(-4)}`

const solToSelectable = (solBalance: number): SelectableToken => {
  const raw = String(Math.round(solBalance * 1e9))
  return {
    mint: WSOL_MINT,
    label: 'SOL',
    decimals: 9,
    maxUi: rawToUi(raw, 9),
  }
}

const tokenToSelectable = (t: MigratableToken): SelectableToken => ({
  mint: t.mint,
  label: t.symbol || t.name || shortenMint(t.mint),
  decimals: t.decimals,
  maxUi: rawToUi(t.balance, t.decimals),
})

export const classifyHoldings = (args: {
  migratable: MigratableToken[]
  solBalance: number
  holdings: WalletHolding[]
}): HoldingsClassification => {
  const { migratable, solBalance, holdings } = args

  const migratableTokens: SelectableToken[] = [
    ...(solBalance > 0 ? [solToSelectable(solBalance)] : []),
    ...migratable.filter((t) => t.uiAmount > 0).map(tokenToSelectable),
  ]

  // The warning counts fungible tokens that can't move. tokenAccounts includes
  // NFT ATAs (decimals 0, supply 1) which aren't tokens, so exclude them.
  const isNft = (h: WalletHolding) => h.decimals === 0 && h.balance === 1

  const leftBehindMints = Array.from(
    new Set(
      holdings
        .filter(
          (h) => h.balance > 0 && !MIGRATABLE_MINTS.has(h.mint) && !isNft(h),
        )
        .map((h) => h.mint),
    ),
  )

  return { migratableTokens, leftBehindMints }
}
