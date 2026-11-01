// Seeds a fresh fixture wallet on the local surfpool mainnet fork for the
// Maestro chain flows. Run by scripts/maestro-surfpool.sh. Logs go to stderr.
// Stdout carries only `export` lines for the Maestro env.
import { fullApiContract } from '@helium/blockchain-api'
import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import type { ContractRouterClient } from '@orpc/contract'
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  VersionedTransaction,
} from '@solana/web3.js'
import * as bip39 from 'bip39'
import { derivePath } from 'ed25519-hd-key'
import { createRequire } from 'module'

// The ESM build of spl-utils does not load in Node (extensionless imports).
const { DC_MINT, HNT_MINT, MOBILE_MINT }: typeof import('@helium/spl-utils') =
  createRequire(process.argv[1])('@helium/spl-utils')

const RPC_URL = process.env.SURFPOOL_RPC_URL || 'http://127.0.0.1:8899'
const API_URL = process.env.BLOCKCHAIN_API_URL || 'http://127.0.0.1:3000'
const DATASOURCE_RPC_URL =
  process.env.SURFPOOL_DATASOURCE_RPC_URL || 'https://solana-rpc.web.helium.io'
// The path the import screen derives first (DEFAULT_DERIVATION_PATH).
const DERIVATION_PATH = "m/44'/501'/0'/0'"
const TOKEN_PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
const RENT_SYSVAR = 'SysvarRent111111111111111111111111111111111'

const SOL_BALANCE = 10
// Whole-token balances. Flow 04 swaps 1 MOBILE, flow 07 sends 0.001 HNT.
const TOKEN_BALANCES = [
  { mint: HNT_MINT, amount: 100, frozen: false },
  { mint: MOBILE_MINT, amount: 10000, frozen: false },
  // DC accounts are frozen on mainnet: DC is not transferable.
  { mint: DC_MINT, amount: 100000, frozen: true },
]
const POSITION_HNT = 10
const POSITION_LOCKUP_DAYS = 365

const log = (message: string) => console.error(`[maestro-seed] ${message}`)

const cheatcode = async (method: string, params: unknown[]) => {
  const res = await fetch(RPC_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  })
  const body = (await res.json()) as { error?: unknown; result?: unknown }
  if (body.error) {
    throw new Error(`${method} failed: ${JSON.stringify(body.error)}`)
  }
  return body.result
}

// Surfpool starts with a default Rent sysvar. Copy the mainnet one so rent
// checks in forked programs match mainnet.
const syncRentSysvar = async () => {
  const source = new Connection(DATASOURCE_RPC_URL, 'confirmed')
  const rent = await source.getAccountInfo(new PublicKey(RENT_SYSVAR))
  if (!rent) throw new Error('Rent sysvar not found on the datasource')
  await cheatcode('surfnet_setAccount', [
    RENT_SYSVAR,
    {
      lamports: rent.lamports,
      data: rent.data.toString('hex'),
      owner: rent.owner.toBase58(),
      executable: rent.executable,
    },
  ])
}

const keypairFromMnemonic = (mnemonic: string) => {
  const seed = bip39.mnemonicToSeedSync(mnemonic, '')
  return Keypair.fromSeed(derivePath(DERIVATION_PATH, seed.toString('hex')).key)
}

const seedTokens = async (connection: Connection, owner: PublicKey) => {
  await Promise.all(
    TOKEN_BALANCES.map(async ({ mint, amount, frozen }) => {
      const { value } = await connection.getTokenSupply(mint)
      const raw = BigInt(amount) * 10n ** BigInt(value.decimals)
      await cheatcode('surfnet_setTokenAccount', [
        owner.toBase58(),
        mint.toBase58(),
        { amount: Number(raw), ...(frozen ? { state: 'frozen' } : {}) },
        TOKEN_PROGRAM,
      ])
    }),
  )
}

// Signs and sends the server-built transactions straight to surfpool.
const signAndSend = async (
  connection: Connection,
  transactions: { serializedTransaction: string }[],
  signer: Keypair,
) => {
  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash('confirmed')
  for (const { serializedTransaction } of transactions) {
    const tx = VersionedTransaction.deserialize(
      Buffer.from(serializedTransaction, 'base64'),
    )
    // A fresh blockhash would void a signature the server already added.
    if (tx.signatures.every((sig) => sig.every((byte) => byte === 0))) {
      tx.message.recentBlockhash = blockhash
    }
    tx.sign([signer])
    const signature = await connection.sendRawTransaction(tx.serialize())
    const { value } = await connection.confirmTransaction(
      { signature, blockhash, lastValidBlockHeight },
      'confirmed',
    )
    if (value.err) {
      throw new Error(`${signature} failed: ${JSON.stringify(value.err)}`)
    }
  }
}

const main = async () => {
  const connection = new Connection(RPC_URL, 'confirmed')
  const api: ContractRouterClient<typeof fullApiContract> = createORPCClient(
    new RPCLink({ url: `${API_URL}/rpc` }),
  )

  await syncRentSysvar()

  const mnemonic = bip39.generateMnemonic(256)
  const wallet = keypairFromMnemonic(mnemonic)
  const recipient = Keypair.generate().publicKey
  log(`fixture wallet ${wallet.publicKey.toBase58()}`)

  const airdrop = await connection.requestAirdrop(
    wallet.publicKey,
    SOL_BALANCE * LAMPORTS_PER_SOL,
  )
  await connection.confirmTransaction(
    { signature: airdrop, ...(await connection.getLatestBlockhash()) },
    'confirmed',
  )
  await seedTokens(connection, wallet.publicKey)

  const { decimals } = (await connection.getTokenSupply(HNT_MINT)).value
  const { transactionData } = await api.governance.createPosition({
    walletAddress: wallet.publicKey.toBase58(),
    tokenAmount: {
      amount: (BigInt(POSITION_HNT) * 10n ** BigInt(decimals)).toString(),
      mint: HNT_MINT.toBase58(),
    },
    lockupKind: 'cliff',
    lockupPeriodsInDays: POSITION_LOCKUP_DAYS,
  })
  await signAndSend(connection, transactionData.transactions, wallet)

  // Read back what the flows rely on.
  const sol = await connection.getBalance(wallet.publicKey)
  log(`SOL ${sol / LAMPORTS_PER_SOL}`)
  await Promise.all(
    TOKEN_BALANCES.map(async ({ mint }) => {
      const { value } = await connection.getTokenAccountsByOwner(
        wallet.publicKey,
        { mint },
      )
      const balance = await connection.getTokenAccountBalance(value[0].pubkey)
      log(`${mint.toBase58()} ${balance.value.uiAmountString}`)
    }),
  )
  const positions = await api.governance.getPositions({
    wallet: wallet.publicKey.toBase58(),
  })
  const undelegated = positions.filter((p) => !p.delegation)
  log(`${positions.length} position(s), ${undelegated.length} undelegated`)
  if (undelegated.length === 0) {
    throw new Error('No undelegated position for flow 05')
  }

  process.stdout.write(
    `export MAESTRO_FIXTURE_SEED='${mnemonic}'\n` +
      `export MAESTRO_RECIPIENT='${recipient.toBase58()}'\n`,
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
