import type { EmbeddedSolanaWalletState } from '@privy-io/expo'

type ConnectedSolanaWallet = Extract<
  EmbeddedSolanaWalletState,
  { status: 'connected' }
>['wallets'][number]

// The Privy embedded Solana wallet is usable only once its provider is
// 'connected' AND at least one derived wallet exists. Both the destination
// address (MigrateToWorld) and the signing provider (executor hook) need the
// first wallet under exactly that combined guard — return it, else undefined.
export const getEmbeddedWallet = (
  solanaWallet: EmbeddedSolanaWalletState,
): ConnectedSolanaWallet | undefined =>
  solanaWallet.status === 'connected' && solanaWallet.wallets?.length
    ? solanaWallet.wallets[0]
    : undefined
