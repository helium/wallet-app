/* eslint-disable no-underscore-dangle */
import {
  Cluster,
  clusterApiUrl,
  ConfirmedSignatureInfo,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  Logs,
  PublicKey,
  SignaturesForAddressOptions,
  Signer,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
  TransactionMessage,
  VersionedMessage,
  VersionedTransaction,
  VersionedTransactionResponse,
  ComputeBudgetProgram,
  AccountMeta,
  SignatureResult,
  ParsedTransactionWithMeta,
  ParsedInstruction,
} from '@solana/web3.js'
import {
  TOKEN_PROGRAM_ID,
  AccountLayout,
  createTransferCheckedInstruction,
  getOrCreateAssociatedTokenAccount,
  getAssociatedTokenAddress,
  getMint,
} from '@solana/spl-token'
import { entityCreatorKey } from '@helium/helium-entity-manager-sdk'
import { daoKey } from '@helium/helium-sub-daos-sdk'
import Balance, { AnyCurrencyType } from '@helium/currency'
import { Metaplex } from '@metaplex-foundation/js'
import axios from 'axios'
import Config from 'react-native-config'
import {
  TreeConfig,
  createTransferInstruction,
  PROGRAM_ID as BUBBLEGUM_PROGRAM_ID,
} from '@metaplex-foundation/mpl-bubblegum'
import {
  ConcurrentMerkleTreeAccount,
  SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
  SPL_NOOP_PROGRAM_ID,
} from '@solana/spl-account-compression'
import bs58 from 'bs58'
import {
  HNT_MINT,
  getAsset,
  searchAssets,
  toBN,
  sendAndConfirmWithRetry,
} from '@helium/spl-utils'
import { AnchorProvider, BN } from '@coral-xyz/anchor'
import * as tm from '@helium/treasury-management-sdk'
import { getPendingRewards } from '@helium/distributor-oracle'
import { init } from '@helium/lazy-distributor-sdk'
import { getKeypair } from '../storage/secureStorage'
import { Activity, Payment } from '../types/activity'
import sleep from './sleep'
import {
  Collectable,
  CompressedNFT,
  EnrichedTransaction,
  mintToTicker,
} from '../types/solana'
import * as Logger from './logger'
import { WrappedConnection } from './WrappedConnection'
import { IOT_LAZY_KEY, Mints, MOBILE_LAZY_KEY } from './constants'

export const SolanaConnection = {
  localnet: new WrappedConnection('http://127.0.0.1:8899'),
  devnet: new WrappedConnection(
    `https://rpc-devnet.helius.xyz/?api-key=${Config.HELIUS_API_KEY}`,
  ),
  testnet: new WrappedConnection(clusterApiUrl('testnet')),
  'mainnet-beta': new WrappedConnection(
    `https://rpc.helius.xyz/?api-key=${Config.HELIUS_API_KEY}`,
  ),
} as const

export const getConnection = (cluster: Cluster) =>
  SolanaConnection[cluster] || SolanaConnection.devnet

export const confirmTransaction = async (
  cluster: Cluster,
  signature: string,
  blockhash: string,
  lastValidBlockHeight: number,
): Promise<SignatureResult> => {
  const conn: WrappedConnection = getConnection(cluster)

  const confirmation = await conn.confirmTransaction(
    { signature, blockhash, lastValidBlockHeight },
    'finalized',
  )
  return confirmation.value
}

export const TXN_FEE_IN_LAMPORTS = 5000
export const TXN_FEE_IN_SOL = TXN_FEE_IN_LAMPORTS / LAMPORTS_PER_SOL

export const solKeypairFromPK = (heliumPK: Buffer) => {
  return Keypair.fromSecretKey(heliumPK)
}

export const airdrop = (cluster: Cluster, address: string) => {
  const key = new PublicKey(address)
  return getConnection(cluster).requestAirdrop(key, LAMPORTS_PER_SOL)
}

export const readHeliumBalances = async (cluster: Cluster, address: string) => {
  const account = new PublicKey(address)

  const tokenAccounts = await getConnection(cluster).getTokenAccountsByOwner(
    account,
    {
      programId: TOKEN_PROGRAM_ID,
    },
  )

  const tokenAccountAddresses = {} as Record<string, string>
  tokenAccounts.value.forEach((tokenAccount) => {
    const accountData = AccountLayout.decode(tokenAccount.account.data)
    tokenAccountAddresses[accountData.mint.toBase58()] =
      tokenAccount.pubkey.toBase58()
  })

  return tokenAccountAddresses
}

export const createTransferTxn = async (
  cluster: Cluster,
  signer: Signer,
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

  const mint = new PublicKey(mintAddress)

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
        new PublicKey(p.payee),
      ),
    ),
  )

  let instructions: TransactionInstruction[] = []
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

  const messageV0 = new TransactionMessage({
    payerKey: payer,
    recentBlockhash: blockhash,
    instructions,
  }).compileToV0Message()

  return new VersionedTransaction(messageV0)
}

export const transferToken = async (
  cluster: Cluster,
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
  const payer = new PublicKey(solanaAddress)
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

  // The sendAndConfirmTransaction socket connection occassionally blows up with the error
  // signatureSubscribe error for argument ["your_signature", {"commitment": "finalized"}] INVALID_STATE_ERR
  // Just going to poll for the txn for now 👇
  const txn = await getTxn(cluster, signature, { maxTries: 20, waitMS: 1000 })

  if (txn?.meta?.err) {
    throw new Error(txn.meta.err.toString())
  }

  return { signature, txn }
}

export const getTxn = async (
  cluster: Cluster,
  signature: string,
  config?: { maxTries?: number; waitMS?: number },
): Promise<VersionedTransactionResponse | null> => {
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

export const getAssocTokenAddress = (
  walletAddress: string,
  mintAddress: string,
) => {
  const account = new PublicKey(walletAddress)
  const mint = new PublicKey(mintAddress)
  return getAssociatedTokenAddress(mint, account)
}

export const getTransactions = async (
  cluster: Cluster,
  walletAddress: string,
  mintAddress: string,
  mints: typeof Mints,
  options?: SignaturesForAddressOptions,
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
  cluster: Cluster,
  address: string,
  callback: (address: string) => void,
) => {
  const account = new PublicKey(address)
  const conn: WrappedConnection | Connection = getConnection(cluster)

  return conn.onAccountChange(account, () => {
    callback(address)
  })
}

export const onLogs = (
  cluster: Cluster,
  address: string,
  callback: (address: string, log: Logs) => void,
) => {
  const account = new PublicKey(address)
  const conn: WrappedConnection = getConnection(cluster)

  return conn.onLogs(
    account,
    (log) => {
      callback(address, log)
    },
    'finalized',
  )
}

export const removeAccountChangeListener = (cluster: Cluster, id: number) => {
  const conn: WrappedConnection = getConnection(cluster)

  return conn.removeAccountChangeListener(id)
}

export const SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID = new PublicKey(
  'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
)

export function createAssociatedTokenAccountInstruction(
  associatedTokenAddress: PublicKey,
  payer: PublicKey,
  walletAddress: PublicKey,
  splTokenMintAddress: PublicKey,
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
      pubkey: SystemProgram.programId,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: TOKEN_PROGRAM_ID,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: SYSVAR_RENT_PUBKEY,
      isSigner: false,
      isWritable: false,
    },
  ]
  return new TransactionInstruction({
    keys,
    programId: SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
    data: Buffer.from([]),
  })
}

export const createTransferCollectableMessage = async (
  cluster: Cluster,
  solanaAddress: string,
  heliumAddress: string,
  collectable: CompressedNFT,
  payee: string,
) => {
  const payer = new PublicKey(solanaAddress)
  const secureAcct = await getKeypair(heliumAddress)
  const conn = getConnection(cluster)

  if (!secureAcct) {
    throw new Error('Secure account not found')
  }

  const signer = {
    publicKey: payer,
    secretKey: secureAcct.privateKey,
  }

  const recipientPubKey = new PublicKey(payee)
  const mintPubkey = new PublicKey(collectable.id)

  const instructions: TransactionInstruction[] = []

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

  const { blockhash } = await conn.getLatestBlockhash()

  const message = new TransactionMessage({
    payerKey: payer,
    recentBlockhash: blockhash,
    instructions,
  }).compileToLegacyMessage()

  return { message }
}

export const transferCollectable = async (
  cluster: Cluster,
  solanaAddress: string,
  heliumAddress: string,
  collectable: CompressedNFT,
  payee: string,
) => {
  const payer = new PublicKey(solanaAddress)
  try {
    const secureAcct = await getKeypair(heliumAddress)
    const conn = getConnection(cluster)

    if (!secureAcct) {
      throw new Error('Secure account not found')
    }

    const signer = {
      publicKey: payer,
      secretKey: secureAcct.privateKey,
    }

    const recipientPubKey = new PublicKey(payee)
    const mintPubkey = new PublicKey(collectable.id)

    const instructions: TransactionInstruction[] = []

    const ownerATA = await getAssociatedTokenAddress(
      mintPubkey,
      signer.publicKey,
    )

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

    const messageV0 = new TransactionMessage({
      payerKey: payer,
      recentBlockhash: blockhash,
      instructions,
    }).compileToLegacyMessage()

    const transaction = new VersionedTransaction(
      VersionedMessage.deserialize(messageV0.serialize()),
    )

    transaction.sign([signer])

    const signature = await conn.sendRawTransaction(transaction.serialize(), {
      skipPreflight: true,
      maxRetries: 5,
    })

    await confirmTransaction(
      cluster,
      signature,
      blockhash,
      lastValidBlockHeight,
    )

    const txn = await getTxn(cluster, signature)

    if (txn?.meta?.err) {
      throw new Error(
        typeof txn.meta.err === 'string'
          ? txn.meta.err
          : JSON.stringify(txn.meta.err),
      )
    }

    return { signature, txn }
  } catch (e) {
    Logger.error(e)
    throw new Error((e as Error).message)
  }
}

/**
 * Convert a buffer to an array of numbers
 * @param buffer
 * @returns
 */
export function bufferToArray(buffer: Buffer): number[] {
  const nums = []
  for (let i = 0; i < buffer.length; i += 1) {
    nums.push(buffer[i])
  }
  return nums
}

/**
 * Get the Bubblegum Authority PDA for a given tree
 * @param merkleRollPubKey
 * @returns
 */
export async function getBubblegumAuthorityPDA(merkleRollPubKey: PublicKey) {
  const [bubblegumAuthorityPDAKey] = await PublicKey.findProgramAddress(
    [merkleRollPubKey.toBuffer()],
    BUBBLEGUM_PROGRAM_ID,
  )
  return bubblegumAuthorityPDAKey
}

/**
 * Get the nonce count for a given tree
 * @param connection
 * @param tree
 * @returns
 */
export async function getNonceCount(
  connection: Connection,
  tree: PublicKey,
): Promise<BN> {
  const treeAuthority = await getBubblegumAuthorityPDA(tree)
  return new BN(
    (await TreeConfig.fromAccountAddress(connection, treeAuthority)).numMinted,
  )
}

const mapProof = (assetProof: { proof: string[] }): AccountMeta[] => {
  if (!assetProof.proof || assetProof.proof.length === 0) {
    throw new Error('Proof is empty')
  }
  return assetProof.proof.map((node) => ({
    pubkey: new PublicKey(node),
    isSigner: false,
    isWritable: false,
  }))
}

/**
 * Transfer a compressed collectable to a new owner
 * @param cluster
 * @param solanaAddress
 * @param heliumAddress
 * @param collectable
 * @param payee
 * @returns
 */
export const transferCompressedCollectable = async (
  cluster: Cluster,
  solanaAddress: string,
  heliumAddress: string,
  collectable: CompressedNFT,
  payee: string,
) => {
  const payer = new PublicKey(solanaAddress)
  try {
    const secureAcct = await getKeypair(heliumAddress)
    const conn = getConnection(cluster)

    if (!secureAcct) {
      throw new Error('Secure account not found')
    }

    const signer = {
      publicKey: payer,
      secretKey: secureAcct.privateKey,
    }

    const recipientPubKey = new PublicKey(payee)

    const instructions: TransactionInstruction[] = []

    const assetProof = await conn.getAssetProof(collectable.id)

    const treeAuthority = await getBubblegumAuthorityPDA(
      new PublicKey(assetProof.tree_id),
    )

    const leafDelegate = collectable.ownership.delegate
      ? new PublicKey(collectable.ownership.delegate)
      : new PublicKey(collectable.ownership.owner)

    const merkleTree = new PublicKey(assetProof.tree_id)

    const tree = await ConcurrentMerkleTreeAccount.fromAccountAddress(
      conn,
      merkleTree,
      'confirmed',
    )

    const canopyHeight = tree.getCanopyDepth()
    const proofPath = mapProof(assetProof)

    const anchorRemainingAccounts = proofPath.slice(
      0,
      proofPath.length - (canopyHeight || 0),
    )

    instructions.push(
      createTransferInstruction(
        {
          treeAuthority,
          leafOwner: new PublicKey(collectable.ownership.owner),
          leafDelegate,
          newLeafOwner: recipientPubKey,
          merkleTree,
          logWrapper: SPL_NOOP_PROGRAM_ID,
          compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
          anchorRemainingAccounts,
        },
        {
          root: bufferToArray(Buffer.from(bs58.decode(assetProof.root))),
          dataHash: bufferToArray(
            Buffer.from(bs58.decode(collectable.compression.data_hash.trim())),
          ),
          creatorHash: bufferToArray(
            Buffer.from(
              bs58.decode(collectable.compression.creator_hash.trim()),
            ),
          ),
          nonce: collectable.compression.leaf_id,
          index: collectable.compression.leaf_id,
        },
      ),
    )

    const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash()

    const messageV0 = new TransactionMessage({
      payerKey: payer,
      recentBlockhash: blockhash,
      instructions,
    }).compileToLegacyMessage()

    const transaction = new VersionedTransaction(
      VersionedMessage.deserialize(messageV0.serialize()),
    )

    transaction.sign([signer])

    const signature = await conn.sendRawTransaction(transaction.serialize(), {
      skipPreflight: true,
      maxRetries: 5,
    })

    await confirmTransaction(
      cluster,
      signature,
      blockhash,
      lastValidBlockHeight,
    )

    const txn = await getTxn(cluster, signature)

    if (txn?.meta?.err) {
      throw new Error(
        typeof txn.meta.err === 'string'
          ? txn.meta.err
          : JSON.stringify(txn.meta.err),
      )
    }

    return { signature, txn }
  } catch (e) {
    Logger.error(e)
    throw new Error((e as Error).message)
  }
}

/**
 * Returns the account's collectables
 * @param pubKey public key of the account
 * @param oldestCollectable starting point for the query
 * @returns collectables
 */
export const getCompressedCollectables = async (
  pubKey: PublicKey,
  cluster: Cluster,
) => {
  const conn = getConnection(cluster)
  const { items } = await conn.getAssetsByOwner(
    pubKey.toString(),
    { sortBy: 'created', sortDirection: 'asc' },
    500,
    0,
    '',
    '',
  )

  return items as CompressedNFT[]
}

export const getCompressedCollectablesByCreator = async (
  pubKey: PublicKey,
  cluster: Cluster,
  page?: number,
  limit?: number,
) => {
  const conn = getConnection(cluster)
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const items = await searchAssets(conn.rpcEndpoint, {
    ownerAddress: pubKey.toBase58(),
    creatorVerified: true,
    creatorAddress: entityCreatorKey(daoKey(HNT_MINT)[0])[0].toBase58(),
    page,
    limit,
  })

  return items as unknown as CompressedNFT[]
}

/**
 * Returns the account's collectables with metadata
 * @param collectables collectables without metadata
 * @param metaplex metaplex connection
 * @returns collectables with metadata
 */
export const getCollectablesMetadata = async (
  collectables: CompressedNFT[],
) => {
  const collectablesWithMetadata = await Promise.all(
    collectables.map(async (col) => {
      try {
        const { data } = await axios.get(col.content.json_uri, {
          timeout: 3000,
        })
        return {
          ...col,
          content: {
            ...col.content,
            metadata: { ...col.content.metadata, ...data },
          },
        }
      } catch (e) {
        Logger.error(e)
        return col
      }
    }),
  )

  return collectablesWithMetadata.filter((c) => c !== null) as CompressedNFT[]
}

/**
 * Returns the account's collectables with metadata
 * @param collectables collectables without metadata
 * @param metaplex metaplex connection
 * @returns collectables with metadata
 */
export const getCompressedNFTMetadata = async (
  collectables: CompressedNFT[],
): Promise<CompressedNFT[]> => {
  const collectablesWithMetadata = await Promise.all(
    collectables.map(async (col) => {
      try {
        const { data } = await axios.get(col.content.json_uri, {
          timeout: 3000,
        })
        return {
          ...col,
          content: {
            ...col.content,
            metadata: { ...col.content.metadata, ...data },
          },
        }
      } catch (e) {
        Logger.error(e)
        return col
      }
    }),
  )

  return collectablesWithMetadata.filter((c) => c !== null) as CompressedNFT[]
}

export type HotspotWithPendingRewards = CompressedNFT & {
  // mint id to pending rewards
  pendingRewards: Record<string, string> | undefined
}

export async function annotateWithPendingRewards(
  provider: AnchorProvider,
  hotspots: CompressedNFT[],
): Promise<HotspotWithPendingRewards[]> {
  const program = await init(provider)
  const dao = daoKey(new PublicKey(Mints.HNT))[0]
  const entityKeys = hotspots.map((h) => {
    return h.content.json_uri.split('/').slice(-1)[0]
  })
  const mobileRewards = await getPendingRewards(
    program,
    MOBILE_LAZY_KEY,
    dao,
    entityKeys,
  )
  const iotRewards = await getPendingRewards(
    program,
    IOT_LAZY_KEY,
    dao,
    entityKeys,
  )

  return hotspots.map((hotspot, index) => {
    const hotspotWithMeta: HotspotWithPendingRewards =
      hotspot as HotspotWithPendingRewards
    hotspotWithMeta.pendingRewards = {
      [Mints.MOBILE]: mobileRewards[entityKeys[index]],
      [Mints.IOT]: iotRewards[entityKeys[index]],
    }
    return hotspotWithMeta
  })
}

/**
 * Returns the account's collectables grouped by token type
 * @param collectables collectables
 * @returns grouped collecables by token type
 */
export const groupCollectables = (collectables: CompressedNFT[]) => {
  const collectablesGroupedByName = collectables.reduce((acc, cur) => {
    const {
      content: {
        metadata: { symbol },
      },
    } = cur

    if (!acc[symbol || 'UNKNOWN']) {
      acc[symbol || 'UNKNOWN'] = [cur]
    } else {
      acc[symbol || 'UNKOWN'].push(cur)
    }
    return acc
  }, {} as Record<string, CompressedNFT[]>)

  return collectablesGroupedByName
}

/**
 * Returns the account's collectables grouped by token type
 * @param collectables collectables with metadata
 * @returns grouped collecables by token type
 */
export const groupCollectablesWithMetaData = (
  collectables: CompressedNFT[],
) => {
  const collectablesGroupedByName = collectables.reduce((acc, cur) => {
    const {
      content: {
        metadata: { symbol },
      },
    } = cur
    if (!acc[symbol || 'UNKNOWN']) {
      acc[symbol || 'UNKNOWN'] = [cur]
    } else {
      acc[symbol || 'UNKNOWN'].push(cur)
    }
    return acc
  }, {} as Record<string, CompressedNFT[]>)

  return collectablesGroupedByName
}

/**
 *
 * @param mint mint address
 * @param metaplex metaplex connection
 * @returns collectable
 */
export const getCollectableByMint = async (
  mint: PublicKey,
  metaplex: Metaplex,
): Promise<Collectable | null> => {
  try {
    const collectable = await metaplex.nfts().findByMint({ mintAddress: mint })
    if (!collectable.json && collectable.uri) {
      const json = await (await fetch(collectable.uri)).json()
      return { ...collectable, json }
    }
    return collectable
  } catch (e) {
    return null
  }
}

/**
 *
 * @param address public key of the account
 * @param cluster cluster
 * @param oldestTransaction starting point of the transaction history
 * @returns transaction history
 */
export const getAllTransactions = async (
  address: string,
  cluster: Cluster,
  oldestTransaction?: string,
): Promise<(EnrichedTransaction | ConfirmedSignatureInfo)[]> => {
  const pubKey = new PublicKey(address)
  const conn = getConnection(cluster)
  const metaplex = new Metaplex(conn, { cluster })
  const parseTransactionsUrl = `${
    cluster === 'devnet' ? Config.HELIUS_DEVNET_API_URL : Config.HELIUS_API_URL
  }/v0/transactions/?api-key=${Config.HELIUS_API_KEY}`

  try {
    const txList = await conn.getSignaturesForAddress(pubKey, {
      before: oldestTransaction,
      limit: 100,
    })
    const sigList = txList.map((tx) => tx.signature)

    if (cluster !== 'mainnet-beta' && cluster !== 'devnet') {
      return txList
    }

    const { data } = await axios.post(parseTransactionsUrl, {
      transactions: sigList,
    })

    /*
     * TODO: Remove this once helius nft indexer is live
     * Getting metadata for collectables.
     */
    const allTxnsWithMetadata: EnrichedTransaction[] = await Promise.all(
      data.map(async (tx: EnrichedTransaction) => {
        try {
          const firstTokenTransfer = tx.tokenTransfers[0]
          if (firstTokenTransfer && firstTokenTransfer.mint) {
            const tokenMetadata = await getCollectableByMint(
              new PublicKey(firstTokenTransfer.mint),
              metaplex,
            )

            return {
              ...tx,
              tokenTransfers: [
                {
                  ...firstTokenTransfer,
                  tokenMetadata: {
                    model: tokenMetadata?.model,
                    name: tokenMetadata?.name,
                    symbol: tokenMetadata?.symbol,
                    uri: tokenMetadata?.uri,
                    json: tokenMetadata?.json,
                  },
                },
              ],
            }
          }

          if (tx?.events?.compressed?.length) {
            const { assetId } = tx.events.compressed[0]
            if (assetId) {
              const compressedNFT = await getAsset(
                conn.rpcEndpoint,
                new PublicKey(assetId),
              )

              if (!compressedNFT) {
                return tx
              }

              const { data: metadata } = await axios.get(
                compressedNFT.content.json_uri,
                {
                  timeout: 3000,
                },
              )

              return {
                ...tx,
                events: {
                  ...tx.events,
                  compressed: [
                    {
                      ...tx.events.compressed[0],
                      metadata: {
                        ...compressedNFT.content.metadata,
                        ...metadata,
                      },
                    },
                    ...tx.events.compressed.slice(1),
                  ],
                },
              }
            }
          }

          return tx
        } catch (e) {
          Logger.error(e)
          return tx
        }
      }),
    )

    const failedTxns = txList.filter((tx) => tx.err)
    const allTxs: (EnrichedTransaction | ConfirmedSignatureInfo)[] = [
      ...allTxnsWithMetadata,
      ...failedTxns,
    ]

    // Combine and sort all txns by date in descending order
    allTxs.sort(
      (
        a: EnrichedTransaction | ConfirmedSignatureInfo,
        b: EnrichedTransaction | ConfirmedSignatureInfo,
      ) => {
        const aEnrichedTransaction = a as EnrichedTransaction
        const aSignatureInfo = a as ConfirmedSignatureInfo
        const bEnrichedTransaction = b as EnrichedTransaction
        const bSignatureInfo = b as ConfirmedSignatureInfo

        const aDate = new Date()
        if (aEnrichedTransaction.timestamp) {
          aDate.setTime(aEnrichedTransaction.timestamp * 1000)
        } else if (aSignatureInfo.blockTime) {
          aDate.setTime(aSignatureInfo.blockTime * 1000)
        }

        const bDate = new Date()
        if (bEnrichedTransaction.timestamp) {
          bDate.setTime(bEnrichedTransaction.timestamp * 1000)
        } else if (bSignatureInfo.blockTime) {
          bDate.setTime(bSignatureInfo.blockTime * 1000)
        }

        return bDate.getTime() - aDate.getTime()
      },
    )

    return allTxs
  } catch (e) {
    return []
  }
}

/**
 *
 * @param cluster Cluster
 * @param amount Amount to swap
 * @param fromMint Mint address of the token to swap
 * @param anchorProvider Anchor provider
 */
export async function createTreasurySwapTxn(
  cluster: Cluster,
  amount: number,
  fromMint: PublicKey,
  anchorProvider: AnchorProvider,
) {
  const conn = getConnection(cluster)
  try {
    const program = await tm.init(anchorProvider)
    const fromMintAcc = await getMint(conn, fromMint)
    const treasuryManagement = tm.treasuryManagementKey(fromMint)[0]

    const tx = await program.methods
      .redeemV0({
        amount: toBN(amount, fromMintAcc.decimals),
        expectedOutputAmount: new BN(0),
      })
      .preInstructions([
        ComputeBudgetProgram.setComputeUnitLimit({ units: 350000 }),
      ])
      .accounts({
        treasuryManagement,
      })
      .transaction()

    const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash(
      'recent',
    )
    tx.recentBlockhash = blockhash
    tx.feePayer = anchorProvider.wallet.publicKey

    const signedTx = await anchorProvider.wallet.signTransaction(tx)

    const signature = await conn.sendRawTransaction(signedTx.serialize(), {
      skipPreflight: true,
    })

    await confirmTransaction(
      cluster,
      signature,
      blockhash,
      lastValidBlockHeight,
    )

    const txn = await getTxn(cluster, signature)

    if (txn?.meta?.err) {
      throw new Error(
        typeof txn.meta.err === 'string'
          ? txn.meta.err
          : JSON.stringify(txn.meta.err),
      )
    }

    return { signature, txn }
  } catch (e) {
    throw e as Error
  }
}

/**
 *
 * @param cluster Cluster
 * @param amount Amount to swap
 * @param fromMint Mint address of the token to swap
 * @param anchorProvider Anchor provider
 */
export async function createTreasurySwapMessage(
  cluster: Cluster,
  amount: number,
  fromMint: PublicKey,
  anchorProvider: AnchorProvider,
) {
  const conn = getConnection(cluster)

  try {
    const program = await tm.init(anchorProvider)
    const fromMintAcc = await getMint(conn, fromMint)

    const treasuryManagement = tm.treasuryManagementKey(fromMint)[0]
    const tx = await program.methods
      .redeemV0({
        amount: toBN(amount, fromMintAcc.decimals),
        expectedOutputAmount: new BN(0),
      })
      .preInstructions([
        ComputeBudgetProgram.setComputeUnitLimit({ units: 350000 }),
      ])
      .accounts({
        treasuryManagement,
      })
      .transaction()

    const { blockhash } = await conn.getLatestBlockhash('recent')

    const message = new TransactionMessage({
      payerKey: anchorProvider.publicKey,
      recentBlockhash: blockhash,
      instructions: [...tx.instructions],
    }).compileToLegacyMessage()

    return { message }
  } catch (e) {
    Logger.error(e)
    throw e as Error
  }
}

export const solInstructionsToActivity = (
  parsedTxn: ParsedTransactionWithMeta | null,
  signature: string,
  mints: typeof Mints,
) => {
  if (!parsedTxn) return

  const activity: Activity = { hash: signature, type: 'unknown' }

  const { transaction, slot, blockTime, meta } = parsedTxn

  activity.fee = meta?.fee
  activity.height = slot

  if (blockTime) {
    activity.time = blockTime
  }

  if (meta?.preTokenBalances && meta.postTokenBalances) {
    const { preTokenBalances, postTokenBalances } = meta
    let payments = [] as Payment[]
    postTokenBalances.forEach((post) => {
      const preBalance = preTokenBalances.find(
        ({ accountIndex }) => accountIndex === post.accountIndex,
      )
      const pre = preBalance || { uiTokenAmount: { amount: '0' } }
      const preAmount = parseInt(pre.uiTokenAmount.amount, 10)
      const postAmount = parseInt(post.uiTokenAmount.amount, 10)
      const amount = postAmount - preAmount
      if (amount < 0) {
        // is payer
        activity.payer = post.owner
        activity.tokenType = mintToTicker(post.mint, mints)
        activity.amount = -1 * amount
      } else {
        // is payee
        const p: Payment = {
          amount,
          payee: post.owner || '',
          tokenType: mintToTicker(post.mint, mints),
        }
        payments = [...payments, p]
      }
    })
    activity.payments = payments
  }

  const transfer = transaction.message.instructions.find((i) => {
    const instruction = i as ParsedInstruction
    return instruction?.parsed?.type === 'transferChecked'
  }) as ParsedInstruction

  if (transfer) {
    // We have a payment
    activity.type = 'payment_v2'
  }

  if (activity.type === 'unknown') return

  return activity
}

export const submitSolana = async ({
  txn,
  cluster,
}: {
  txn: Buffer
  cluster: Cluster
}) => {
  const conn = getConnection(cluster)
  const { txid } = await sendAndConfirmWithRetry(
    conn,
    txn,
    { skipPreflight: true },
    'confirmed',
  )

  return txid
}
