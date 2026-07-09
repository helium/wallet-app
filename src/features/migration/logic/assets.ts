import { rawToUi } from './amounts'
import { MIGRATABLE_MINTS, WSOL_MINT } from './mints'
import {
  HoldingsClassification,
  MigratableToken,
  SelectableToken,
  WalletHolding,
} from './types'

const solToSelectable = (solBalance: number): SelectableToken => {
  const raw = String(Math.round(solBalance * 1e9))
  return {
    mint: WSOL_MINT,
    label: 'SOL',
    decimals: 9,
    maxRaw: raw,
    maxUi: rawToUi(raw, 9),
  }
}

const tokenToSelectable = (t: MigratableToken): SelectableToken => ({
  mint: t.mint,
  label: t.symbol || t.name || `${t.mint.slice(0, 4)}…${t.mint.slice(-4)}`,
  decimals: t.decimals,
  maxRaw: t.balance,
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

  const leftBehindMints = Array.from(
    new Set(
      holdings
        .filter((h) => h.balance > 0 && !MIGRATABLE_MINTS.has(h.mint))
        .map((h) => h.mint),
    ),
  )

  return { migratableTokens, leftBehindMints }
}
