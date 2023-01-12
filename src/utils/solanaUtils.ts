import * as web3 from '@solana/web3.js'
import {
  TOKEN_PROGRAM_ID,
  AccountLayout,
  createTransferCheckedInstruction,
  getOrCreateAssociatedTokenAccount,
  getAssociatedTokenAddress,
} from '@solana/spl-token'
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
import BN from 'bn.js'
import { getKeypair } from '../storage/secureStorage'
import solInstructionsToActivity from './solInstructionsToActivity'
import { Activity } from '../types/activity'
import sleep from './sleep'
import { Mints } from '../store/slices/walletRestApi'
import {
  Collectable,
  CompressedNFT,
  EnrichedTransaction,
} from '../types/solana'
import * as Logger from './logger'
import { WrappedConnection } from './WrappedConnection'

const Connection = {
  localnet: new WrappedConnection('http://127.0.0.1:8899'),
  devnet: new WrappedConnection('https://rpc-devnet.aws.metaplex.com/'),
  testnet: new WrappedConnection(web3.clusterApiUrl('testnet')),
  'mainnet-beta': new WrappedConnection(web3.clusterApiUrl('mainnet-beta')),
} as const

export const getConnection = (cluster: web3.Cluster) =>
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
    iotBalance: vals[mints.IOT],
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
  callback: (address: string, log: web3.Logs) => void,
) => {
  const account = new web3.PublicKey(address)
  return getConnection(cluster).onLogs(
    account,
    (log) => {
      callback(address, log)
    },
    'finalized',
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

export const createTransferCollectableMessage = async (
  cluster: web3.Cluster,
  solanaAddress: string,
  heliumAddress: string,
  collectable: CompressedNFT,
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
  const mintPubkey = new web3.PublicKey(collectable.id)

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

  const { blockhash } = await conn.getLatestBlockhash()

  const message = new web3.TransactionMessage({
    payerKey: payer,
    recentBlockhash: blockhash,
    instructions,
  }).compileToLegacyMessage()

  return { message }
}

export const transferCollectable = async (
  cluster: web3.Cluster,
  solanaAddress: string,
  heliumAddress: string,
  collectable: CompressedNFT,
  payee: string,
) => {
  const payer = new web3.PublicKey(solanaAddress)
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

    const recipientPubKey = new web3.PublicKey(payee)
    const mintPubkey = new web3.PublicKey(collectable.id)

    const instructions: web3.TransactionInstruction[] = []

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

    const messageV0 = new web3.TransactionMessage({
      payerKey: payer,
      recentBlockhash: blockhash,
      instructions,
    }).compileToLegacyMessage()

    const transaction = new web3.VersionedTransaction(
      web3.VersionedMessage.deserialize(messageV0.serialize()),
    )

    transaction.sign([signer])

    const signature = await conn.sendRawTransaction(transaction.serialize(), {
      skipPreflight: true,
      maxRetries: 5,
    })

    await conn.confirmTransaction(
      { signature, blockhash, lastValidBlockHeight },
      'finalized',
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
export async function getBubblegumAuthorityPDA(
  merkleRollPubKey: web3.PublicKey,
) {
  const [bubblegumAuthorityPDAKey] = await web3.PublicKey.findProgramAddress(
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
  connection: web3.Connection,
  tree: web3.PublicKey,
): Promise<BN> {
  const treeAuthority = await getBubblegumAuthorityPDA(tree)
  return new BN(
    (await TreeConfig.fromAccountAddress(connection, treeAuthority)).numMinted,
  )
}

const mapProof = (assetProof: { proof: string[] }): web3.AccountMeta[] => {
  if (!assetProof.proof || assetProof.proof.length === 0) {
    throw new Error('Proof is empty')
  }
  return assetProof.proof.map((node) => ({
    pubkey: new web3.PublicKey(node),
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
  cluster: web3.Cluster,
  solanaAddress: string,
  heliumAddress: string,
  collectable: CompressedNFT,
  payee: string,
) => {
  const payer = new web3.PublicKey(solanaAddress)
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

    const recipientPubKey = new web3.PublicKey(payee)

    const instructions: web3.TransactionInstruction[] = []

    const assetProof = await conn.getAssetProof(collectable.id)

    const nonceCount = await getNonceCount(
      conn,
      new web3.PublicKey(assetProof.tree_id),
    )

    const leafNonce = nonceCount.sub(new BN(1))

    const treeAuthority = await getBubblegumAuthorityPDA(
      new web3.PublicKey(assetProof.tree_id),
    )

    const leafDelegate = collectable.ownership.delegate
      ? new web3.PublicKey(collectable.ownership.delegate)
      : new web3.PublicKey(collectable.ownership.owner)

    const merkleTree = new web3.PublicKey(assetProof.tree_id)

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
          leafOwner: new web3.PublicKey(collectable.ownership.owner),
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
          nonce: leafNonce,
          index: 0,
        },
      ),
    )

    const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash()

    const messageV0 = new web3.TransactionMessage({
      payerKey: payer,
      recentBlockhash: blockhash,
      instructions,
    }).compileToLegacyMessage()

    const transaction = new web3.VersionedTransaction(
      web3.VersionedMessage.deserialize(messageV0.serialize()),
    )

    transaction.sign([signer])

    const signature = await conn.sendRawTransaction(transaction.serialize(), {
      skipPreflight: true,
      maxRetries: 5,
    })

    await conn.confirmTransaction(
      { signature, blockhash, lastValidBlockHeight },
      'finalized',
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
 * TODO: Need to add pagination via oldest collectable param in collectables slice
 */
export const getCompressedCollectables = async (
  pubKey: web3.PublicKey,
  cluster: web3.Cluster,
  oldestCollectable?: string,
) => {
  // TODO: Replace with devnet when metaplex RPC is ready for all other txs to be sent to devnet
  const conn = getConnection(cluster)
  const { items } = await conn.getAssetsByOwner(
    pubKey.toString(),
    'created',
    50,
    1,
    '',
    oldestCollectable || '',
  )

  return items as CompressedNFT[]
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
      let json
      try {
        json = await (await fetch(col.content.json_uri)).json()
        return {
          ...col,
          content: {
            ...col.content,
            metadata: { ...col.content.metadata, ...json },
          },
        }
      } catch (e) {
        Logger.error(e)
        return null
      }
    }),
  )

  return collectablesWithMetadata.filter((c) => c !== null) as CompressedNFT[]
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
  mint: web3.PublicKey,
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
  cluster: web3.Cluster,
  oldestTransaction?: string,
): Promise<(EnrichedTransaction | web3.ConfirmedSignatureInfo)[]> => {
  const pubKey = new web3.PublicKey(address)
  const conn = getConnection(cluster)
  const metaplex = new Metaplex(conn, { cluster })
  const parseTransactionsUrl = `${Config.HELIUS_API_URL}/v0/transactions/?api-key=${Config.HELIUS_API_KEY}`

  try {
    const txList = await conn.getSignaturesForAddress(pubKey, {
      before: oldestTransaction,
      limit: 100,
    })
    const sigList = txList.map((tx) => tx.signature)

    if (cluster !== 'mainnet-beta') {
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
        const firstTokenTransfer = tx.tokenTransfers[0]
        if (firstTokenTransfer && firstTokenTransfer.mint) {
          const tokenMetadata = await getCollectableByMint(
            new web3.PublicKey(firstTokenTransfer.mint),
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

        return tx
      }),
    )

    const failedTxns = txList.filter((tx) => tx.err)
    const allTxs: (EnrichedTransaction | web3.ConfirmedSignatureInfo)[] = [
      ...allTxnsWithMetadata,
      ...failedTxns,
    ]
    // Combine and sort all txns by date in descending order
    allTxs.sort(
      (
        a: EnrichedTransaction | web3.ConfirmedSignatureInfo,
        b: EnrichedTransaction | web3.ConfirmedSignatureInfo,
      ) => {
        const aEnrichedTransaction = a as EnrichedTransaction
        const aSignatureInfo = a as web3.ConfirmedSignatureInfo
        const bEnrichedTransaction = b as EnrichedTransaction
        const bSignatureInfo = b as web3.ConfirmedSignatureInfo

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
