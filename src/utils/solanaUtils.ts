import * as web3 from '@solana/web3.js'
import {
  TOKEN_PROGRAM_ID,
  AccountLayout,
  createTransferCheckedInstruction,
  getOrCreateAssociatedTokenAccount,
  getAssociatedTokenAddress,
} from '@solana/spl-token'
import Balance, { AnyCurrencyType } from '@helium/currency'
import { JsonMetadata, Metadata, Metaplex } from '@metaplex-foundation/js'
import { getKeypair } from '../storage/secureStorage'
import solInstructionsToActivity from './solInstructionsToActivity'
import { Activity } from '../types/activity'
import sleep from './sleep'
import { Mints } from '../store/slices/walletRestApi'
import { Collectable } from '../types/solana'

const Connection = {
  devnet: new web3.Connection(web3.clusterApiUrl('devnet')),
  testnet: new web3.Connection(web3.clusterApiUrl('testnet')),
  'mainnet-beta': new web3.Connection(web3.clusterApiUrl('mainnet-beta')),
} as const

const getConnection = (cluster: web3.Cluster) =>
  Connection[cluster] || Connection.devnet

export const TXN_FEE_IN_LAMPORTS = 5000
export const TXN_FEE_IN_SOL = TXN_FEE_IN_LAMPORTS / web3.LAMPORTS_PER_SOL

export const solKeypairFromPK = (heliumPK: Buffer) => {
  return web3.Keypair.fromSecretKey(heliumPK)
}

export const airdrop = (cluster: web3.Cluster, address: string) => {
  const key = new web3.PublicKey(address)
  return getConnection(cluster).requestAirdrop(key, web3.LAMPORTS_PER_SOL)
}

export const readHeliumBalances = async (
  cluster: web3.Cluster,
  address: string,
  mints: Mints,
) => {
  const account = new web3.PublicKey(address)

  const tokenAccounts = await getConnection(cluster).getTokenAccountsByOwner(
    account,
    {
      programId: TOKEN_PROGRAM_ID,
    },
  )

  const vals = {} as Record<string, bigint>
  tokenAccounts.value.forEach((tokenAccount) => {
    const accountData = AccountLayout.decode(tokenAccount.account.data)
    vals[accountData.mint.toBase58()] = accountData.amount
  })

  return {
    hntBalance: vals[mints.HNT],
    mobileBalance: vals[mints.MOBILE],
    dcBalance: vals[mints.DC],
  }
}

export const readSolanaBalance = async (
  cluster: web3.Cluster,
  address: string,
) => {
  const key = new web3.PublicKey(address)
  return getConnection(cluster).getBalance(key)
}

export const createTransferTxn = async (
  cluster: web3.Cluster,
  signer: web3.Signer,
  payments: {
    payee: string
    balanceAmount: Balance<AnyCurrencyType>
    memo: string
    max?: boolean
  }[],
  mintAddress: string,
) => {
  if (!payments.length) throw new Error('No payment found')

  const conn = getConnection(cluster)

  const [firstPayment] = payments

  const payer = signer.publicKey

  const mint = new web3.PublicKey(mintAddress)

  const payerATA = await getOrCreateAssociatedTokenAccount(
    conn,
    signer,
    mint,
    payer,
  )

  const payeeATAs = await Promise.all(
    payments.map((p) =>
      getOrCreateAssociatedTokenAccount(
        conn,
        signer,
        mint,
        new web3.PublicKey(p.payee),
      ),
    ),
  )

  let instructions: web3.TransactionInstruction[] = []
  payments.forEach((p, idx) => {
    const amount = p.balanceAmount.integerBalance

    const instruction = createTransferCheckedInstruction(
      payerATA.address,
      mint,
      payeeATAs[idx].address,
      payer,
      amount,
      firstPayment.balanceAmount.type.decimalPlaces.toNumber(),
      [signer],
    )

    instructions = [...instructions, instruction]
  })

  const { blockhash } = await getConnection(cluster).getLatestBlockhash()

  const messageV0 = new web3.TransactionMessage({
    payerKey: payer,
    recentBlockhash: blockhash,
    instructions,
  }).compileToV0Message()

  return new web3.VersionedTransaction(messageV0)
}

export const transferToken = async (
  cluster: web3.Cluster,
  solanaAddress: string,
  heliumAddress: string,
  payments: {
    payee: string
    balanceAmount: Balance<AnyCurrencyType>
    memo: string
    max?: boolean
  }[],
  mintAddress: string,
) => {
  const payer = new web3.PublicKey(solanaAddress)
  const secureAcct = await getKeypair(heliumAddress)

  if (!secureAcct) {
    throw new Error('Secure account not found')
  }

  const signer = {
    publicKey: payer,
    secretKey: secureAcct.privateKey,
  }

  const transaction = await createTransferTxn(
    cluster,
    signer,
    payments,
    mintAddress,
  )
  transaction.sign([signer])

  const signature = await getConnection(cluster).sendTransaction(transaction, {
    maxRetries: 5,
  })

  // The web3.sendAndConfirmTransaction socket connection occassionally blows up with the error
  // signatureSubscribe error for argument ["your_signature", {"commitment": "finalized"}] INVALID_STATE_ERR
  // Just going to poll for the txn for now 👇
  const txn = await getTxn(cluster, signature, { maxTries: 20, waitMS: 1000 })

  if (txn?.meta?.err) {
    throw new Error(txn.meta.err.toString())
  }

  return { signature, txn }
}

export const getTxn = async (
  cluster: web3.Cluster,
  signature: string,
  config?: { maxTries?: number; waitMS?: number },
): Promise<web3.VersionedTransactionResponse | null> => {
  const maxTries = config?.maxTries || 1
  const waitMS = config?.waitMS || 500

  const txn = await getConnection(cluster).getTransaction(signature, {
    maxSupportedTransactionVersion: 0,
  })

  const remainingTries = maxTries - 1
  if (txn || remainingTries === 0) return txn

  await sleep(waitMS)

  return getTxn(cluster, signature, { maxTries: remainingTries, waitMS })
}

export const confirmTxn = async (cluster: web3.Cluster, signature: string) => {
  const { blockhash, lastValidBlockHeight } = await getConnection(
    cluster,
  ).getLatestBlockhash()

  return getConnection(cluster).confirmTransaction({
    blockhash,
    lastValidBlockHeight,
    signature,
  })
}

export const getAssocTokenAddress = (
  walletAddress: string,
  mintAddress: string,
) => {
  const account = new web3.PublicKey(walletAddress)
  const mint = new web3.PublicKey(mintAddress)
  return getAssociatedTokenAddress(mint, account)
}

export const getTransactions = async (
  cluster: web3.Cluster,
  walletAddress: string,
  mintAddress: string,
  mints: Mints,
  options?: web3.SignaturesForAddressOptions,
) => {
  const ata = await getAssocTokenAddress(walletAddress, mintAddress)
  const transactionList = await getConnection(cluster).getSignaturesForAddress(
    ata,
    options,
  )
  const sigs = transactionList.map(({ signature }) => signature)

  const transactionDetails = await getConnection(cluster).getParsedTransactions(
    sigs,
    {
      maxSupportedTransactionVersion: 0,
    },
  )

  return transactionDetails
    .map((td, idx) => solInstructionsToActivity(td, sigs[idx], mints))
    .filter((a) => !!a) as Activity[]
}

export const onAccountChange = (
  cluster: web3.Cluster,
  address: string,
  callback: (address: string) => void,
) => {
  const account = new web3.PublicKey(address)
  return getConnection(cluster).onAccountChange(account, () => {
    callback(address)
  })
}

export const onLogs = (
  cluster: web3.Cluster,
  address: string,
  callback: (address: string) => void,
) => {
  const account = new web3.PublicKey(address)
  return getConnection(cluster).onLogs(
    account,
    () => {
      callback(address)
    },
    'confirmed',
  )
}

export const removeAccountChangeListener = (
  cluster: web3.Cluster,
  id: number,
) => {
  return getConnection(cluster).removeAccountChangeListener(id)
}

export const SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID = new web3.PublicKey(
  'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
)

export function createAssociatedTokenAccountInstruction(
  associatedTokenAddress: web3.PublicKey,
  payer: web3.PublicKey,
  walletAddress: web3.PublicKey,
  splTokenMintAddress: web3.PublicKey,
) {
  const keys = [
    {
      pubkey: payer,
      isSigner: true,
      isWritable: true,
    },
    {
      pubkey: associatedTokenAddress,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: walletAddress,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: splTokenMintAddress,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: web3.SystemProgram.programId,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: TOKEN_PROGRAM_ID,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: web3.SYSVAR_RENT_PUBKEY,
      isSigner: false,
      isWritable: false,
    },
  ]
  return new web3.TransactionInstruction({
    keys,
    programId: SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
    data: Buffer.from([]),
  })
}

export const transferCollectable = async (
  cluster: web3.Cluster,
  solanaAddress: string,
  heliumAddress: string,
  collectable: Collectable,
  payee: string,
) => {
  const payer = new web3.PublicKey(solanaAddress)
  const secureAcct = await getKeypair(heliumAddress)
  const conn = getConnection(cluster)

  if (!secureAcct) {
    throw new Error('Secure account not found')
  }

  const signer = {
    publicKey: payer,
    secretKey: secureAcct.privateKey,
  }

  const recipientPubKey = new web3.PublicKey(payee)
  const mintPubkey = new web3.PublicKey(collectable.mint.address)

  const instructions: web3.TransactionInstruction[] = []

  const ownerATA = await getAssociatedTokenAddress(mintPubkey, signer.publicKey)

  if (!(await conn.getAccountInfo(ownerATA))) {
    instructions.push(
      createAssociatedTokenAccountInstruction(
        ownerATA,
        signer.publicKey,
        signer.publicKey,
        mintPubkey,
      ),
    )
  }

  const recipientATA = await getAssociatedTokenAddress(
    mintPubkey,
    recipientPubKey,
  )

  if (!(await conn.getAccountInfo(recipientATA))) {
    instructions.push(
      createAssociatedTokenAccountInstruction(
        recipientATA,
        signer.publicKey,
        recipientPubKey,
        mintPubkey,
      ),
    )
  }

  instructions.push(
    createTransferCheckedInstruction(
      ownerATA, // from (should be a token account)
      mintPubkey, // mint
      recipientATA, // to (should be a token account)
      signer.publicKey, // from's owner
      1, // amount
      0, // decimals
      [], // signers
    ),
  )

  const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash()

  const messageV0 = new web3.TransactionMessage({
    payerKey: payer,
    recentBlockhash: blockhash,
    instructions,
  }).compileToV0Message()

  const transaction = new web3.VersionedTransaction(messageV0)

  transaction.sign([signer])

  const signature = await conn.sendTransaction(transaction, {
    maxRetries: 5,
  })

  await conn.confirmTransaction(
    { signature, blockhash, lastValidBlockHeight },
    'finalized',
  )
  const txn = await getTxn(cluster, signature)

  if (txn?.meta?.err) {
    throw new Error(txn.meta.err.toString())
  }

  return { signature, txn }
}

/**
 * Returns the account's collectables
 * @param pubKey public key of the account
 * @param metaplex metaplex connection
 * @returns collectables
 */
export const getCollectables = async (
  pubKey: web3.PublicKey,
  metaplex: Metaplex,
) => {
  const collectables = (await metaplex
    .nfts()
    .findAllByOwner({ owner: pubKey })
    .run()) as Metadata<JsonMetadata<string>>[]

  return collectables
}

/**
 * Returns the account's collectables with metadata
 * @param collectables collectables without metadata
 * @param metaplex metaplex connection
 * @returns collectables with metadata
 */
export const getCollectablesMetadata = async (
  collectables: Metadata<JsonMetadata<string>>[],
  metaplex: Metaplex,
) => {
  const collectablesWithMetadata = await Promise.all(
    collectables.map(async (col) => {
      const json = await (await fetch(col.uri)).json()
      const metadata = await metaplex.nfts().load({ metadata: col }).run()
      return { ...metadata, json }
    }),
  )

  return collectablesWithMetadata
}

/**
 * Returns the account's collectables grouped by token type
 * @param collectables collectables
 * @returns grouped collecables by token type
 */
export const groupCollectables = (
  collectables: Metadata<JsonMetadata<string>>[],
) => {
  const collectablesGroupedByName = collectables.reduce((acc, cur) => {
    const { symbol } = cur
    if (!acc[symbol]) {
      acc[symbol] = [cur]
    } else {
      acc[symbol].push(cur)
    }
    return acc
  }, {} as Record<string, Metadata<JsonMetadata<string>>[]>)

  return collectablesGroupedByName
}

/**
 * Returns the account's collectables grouped by token type
 * @param collectables collectables with metadata
 * @returns grouped collecables by token type
 */
export const groupCollectablesWithMetaData = (collectables: Collectable[]) => {
  const collectablesGroupedByName = collectables.reduce((acc, cur) => {
    const { symbol } = cur.json as Collectable
    if (!acc[symbol]) {
      acc[symbol] = [cur]
    } else {
      acc[symbol].push(cur)
    }
    return acc
  }, {} as Record<string, Collectable[]>)

  return collectablesGroupedByName
}
