// Mint addresses the migration backend supports. Literal strings keep this
// module node-testable and dependency-free. Cross-ref src/utils/constants.ts
// (Mints) and @helium/spl-utils for the canonical Helium mints.
export const WSOL_MINT = 'So11111111111111111111111111111111111111112'

export const MIGRATABLE_MINTS: ReadonlySet<string> = new Set([
  WSOL_MINT, // native SOL (wrapped)
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
  'hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux', // HNT
  'mb1eu7TzEc71KxDpsmsKoucSSuuoGLv1drys1oP2jh6', // MOBILE
  'iotEVVZLEywoTn1QdwNPddxPWszn3zFhEot3MfL9fns', // IOT
  'dcuc8Amr83Wz27ZkQ2K9NS6r8zRpf1J6cvArEBDZDmm', // DC
])
