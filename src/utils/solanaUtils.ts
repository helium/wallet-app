/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-underscore-dangle */
import { AnchorProvider, BN, IdlAccounts, Program } from '@coral-xyz/anchor'
import { getSingleton } from '@helium/account-fetch-cache'
import {
  delegatedDataCreditsKey,
  escrowAccountKey,
  init as initDc,
} from '@helium/data-credits-sdk'
import { getPendingRewards } from '@helium/distributor-oracle'
import {
  PROGRAM_ID as FanoutProgramId,
  fanoutKey,
  membershipCollectionKey,
} from '@helium/fanout-sdk'
import {
  decodeEntityKey,
  entityCreatorKey,
  init as initHem,
  keyToAssetForAsset,
} from '@helium/helium-entity-manager-sdk'
import { subDaoKey } from '@helium/helium-sub-daos-sdk'
import { HeliumEntityManager } from '@helium/idls/lib/types/helium_entity_manager'
import {
  init as initLazy,
  initializeCompressionRecipient,
  recipientKey,
} from '@helium/lazy-distributor-sdk'
import {
  Asset,
  DC_MINT,
  HNT_MINT,
  IOT_MINT,
  MOBILE_MINT,
  TransactionDraft,
  getAsset,
  proofArgsAndAccounts,
  searchAssetsWithPageInfo,
  sendAndConfirmWithRetry,
  toBN,
  truthy,
} from '@helium/spl-utils'
import {
  init as initTm,
  treasuryManagementKey,
} from '@helium/treasury-management-sdk'
import {
  PROGRAM_ID as VoterStakeRegistryProgramId,
  registrarCollectionKey,
  registrarKey,
} from '@helium/voter-stake-registry-sdk'
import { IotHotspotInfoV0 } from '@hooks/useIotInfo'
import { KeyToAssetV0 } from '@hooks/useKeyToAsset'
import {
  METADATA_PARSER,
  getMetadata,
  getMetadataId,
} from '@hooks/useMetaplexMetadata'
import { MobileHotspotInfoV0 } from '@hooks/useMobileInfo'
import { RecipientV0 } from '@hooks/useRecipient'
import {
  PROGRAM_ID as BUBBLEGUM_PROGRAM_ID,
  TreeConfig,
  createTransferInstruction,
} from '@metaplex-foundation/mpl-bubblegum'
import {
  ConcurrentMerkleTreeAccount,
  SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
  SPL_NOOP_PROGRAM_ID,
} from '@solana/spl-account-compression'
import { createMemoInstruction } from '@solana/spl-memo'
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  AccountLayout,
  NATIVE_MINT,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  createAssociatedTokenAccountInstruction,
  createTransferCheckedInstruction,
  getAccount,
  getAssociatedTokenAddress,
  getAssociatedTokenAddressSync,
  getMint,
} from '@solana/spl-token'
import {
  AccountMeta,
  AddressLookupTableAccount,
  Cluster,
  ComputeBudgetProgram,
  ConfirmedSignatureInfo,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  Logs,
  ParsedTransactionWithMeta,
  PublicKey,
  SignatureResult,
  SignaturesForAddressOptions,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  TransactionMessage,
  VersionedMessage,
  VersionedTransaction,
  VersionedTransactionResponse,
  clusterApiUrl,
} from '@solana/web3.js'
import { withPriorityFees } from '@utils/priorityFees'
import axios from 'axios'
import bs58 from 'bs58'
import Config from 'react-native-config'
import { getSessionKey } from '../storage/secureStorage'
import { Activity, Payment } from '../types/activity'
import {
  Collectable,
  CompressedNFT,
  EnrichedTransaction,
  HotspotWithPendingRewards,
} from '../types/solana'
import { WrappedConnection } from './WrappedConnection'
import { solAddressIsValid } from './accountUtils'
import { DAO_KEY, IOT_LAZY_KEY, MOBILE_LAZY_KEY, Mints } from './constants'
import { decimalSeparator, groupSeparator } from './i18n'
import * as Logger from './logger'
import sleep from './sleep'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isInsufficientBal(e: any) {
  return (
    e.toString().includes('Insufficient Balance') ||
    e.toString().includes('"Custom":1') ||
    e.InstructionError?.[1]?.Custom === 1
  )
}

export const isVersionedTransaction = (
  tx: Transaction | VersionedTransaction,
): tx is VersionedTransaction => {
  return 'version' in tx
}

export function humanReadable(
  amount?: BN,
  decimals?: number,
): string | undefined {
  if (typeof decimals === 'undefined' || typeof amount === 'undefined') return

  const input = amount.toString()
  const integerPart =
    input.length > decimals ? input.slice(0, input.length - decimals) : ''
  const formattedIntegerPart = integerPart.replace(
    /\B(?=(\d{3})+(?!\d))/g,
    groupSeparator,
  )
  const decimalPart =
    decimals !== 0
      ? input
          .slice(-decimals)
          .padStart(decimals, '0') // Add prefix zeros
          .replace(/0+$/, '') // Remove trailing zeros
      : ''

  return `${formattedIntegerPart.length > 0 ? formattedIntegerPart : '0'}${
    Number(decimalPart) !== 0 ? `${decimalSeparator}${decimalPart}` : ''
  }`
}

const govProgramId = new PublicKey(
  'hgovkRU6Ghe1Qoyb54HdSLdqN7VtxaifBzRmh9jtd3S',
)

export const SolanaConnection = (sessionKey: string) =>
  ({
    devnet: new WrappedConnection(
      `${Config.DEVNET_RPC_URL}/?session-key=${sessionKey}`,
    ),
    testnet: new WrappedConnection(clusterApiUrl('testnet')),
    'mainnet-beta': new WrappedConnection(
      `${Config.MAINNET_RPC_URL}/?session-key=${sessionKey}`,
    ),
  } as const)

export const getConnection = (cluster: Cluster, sessionKey: string) =>
  SolanaConnection(sessionKey)[cluster] || SolanaConnection(sessionKey).devnet

export const confirmTransaction = async (
  anchorProvider: AnchorProvider,
  signature: string,
  blockhash: string,
  lastValidBlockHeight: number,
): Promise<SignatureResult> => {
  const conn = anchorProvider.connection as WrappedConnection

  const confirmation = await conn.confirmTransaction(
    { signature, blockhash, lastValidBlockHeight },
    'confirmed',
  )
  return confirmation.value
}

export const TXN_FEE_IN_LAMPORTS = 5000
export const TXN_FEE_IN_SOL = TXN_FEE_IN_LAMPORTS / LAMPORTS_PER_SOL

export const solKeypairFromPK = (heliumPK: Buffer) => {
  return Keypair.fromSecretKey(heliumPK)
}

export const airdrop = (anchorProvider: AnchorProvider, address: string) => {
  const key = new PublicKey(address)
  return anchorProvider.connection.requestAirdrop(key, LAMPORTS_PER_SOL)
}

export const readHeliumBalances = async (
  anchorProvider: AnchorProvider,
  address: string,
) => {
  const account = new PublicKey(address)

  const tokenAccounts = await anchorProvider.connection.getTokenAccountsByOwner(
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

export const createTransferSolTxn = async (
  anchorProvider: AnchorProvider,
  payer: PublicKey,
  payments: {
    payee: string
    balanceAmount: BN
    max?: boolean
  }[],
): Promise<TransactionDraft> => {
  if (!payments.length) throw new Error('No payment found')

  let instructions: TransactionInstruction[] = []
  payments.forEach((p) => {
    const amount = p.balanceAmount

    const instruction = SystemProgram.transfer({
      fromPubkey: payer,
      toPubkey: new PublicKey(p.payee),
      lamports: BigInt(amount.toString()),
    })

    instructions = [...instructions, instruction]
  })

  const maxPayment = payments.find((p) => p.max)

  let finalInstructions = instructions
  // TODO: need to refactor PaymentScreen and usePaymentReducer to handle sub priority fee from maxAmount
  if (!maxPayment) {
    finalInstructions = await withPriorityFees({
      connection: anchorProvider.connection,
      computeUnits: 10000,
      instructions,
      feePayer: payer,
    })
  }

  return {
    instructions: finalInstructions,
    feePayer: payer,
  }
}

export const createTransferTxn = async (
  anchorProvider: AnchorProvider,
  payer: PublicKey,
  payments: {
    payee: string
    balanceAmount: BN
    max?: boolean
  }[],
  mintAddress: string,
): Promise<TransactionDraft> => {
  if (!payments.length) throw new Error('No payment found')

  const conn = anchorProvider.connection

  const mint = new PublicKey(mintAddress)
  const mintAcc = await getMint(conn, mint)

  const payerATA = await getAssociatedTokenAddress(mint, payer)

  let instructions: TransactionInstruction[] = []
  payments.forEach((p) => {
    const amount = p.balanceAmount
    const ata = getAssociatedTokenAddressSync(
      mint,
      new PublicKey(p.payee),
      true,
    )

    instructions = [
      ...instructions,
      createAssociatedTokenAccountIdempotentInstruction(
        anchorProvider.publicKey,
        ata,
        new PublicKey(p.payee),
        mint,
      ),
      createTransferCheckedInstruction(
        payerATA,
        mint,
        ata,
        payer,
        BigInt(amount.toString()),
        mintAcc.decimals,
      ),
    ]
  })

  return {
    instructions: await withPriorityFees({
      connection: anchorProvider.connection,
      instructions,
      feePayer: new PublicKey(payer),
    }),
    feePayer: payer,
  }
}

export const transferToken = async (
  anchorProvider: AnchorProvider,
  solanaAddress: string,
  heliumAddress: string,
  payments: {
    payee: string
    balanceAmount: BN
    max?: boolean
  }[],
  mintAddress?: string,
) => {
  const payer = new PublicKey(solanaAddress)

  const transaction =
    !mintAddress || mintAddress === NATIVE_MINT.toBase58()
      ? await createTransferSolTxn(anchorProvider, payer, payments)
      : await createTransferTxn(anchorProvider, payer, payments, mintAddress)

  return transaction
}

export const getTxn = async (
  anchorProvider: AnchorProvider,
  signature: string,
  config?: { maxTries?: number; waitMS?: number },
): Promise<VersionedTransactionResponse | null> => {
  const maxTries = config?.maxTries || 1
  const waitMS = config?.waitMS || 500

  const txn = await anchorProvider.connection.getTransaction(signature, {
    maxSupportedTransactionVersion: 0,
  })

  const remainingTries = maxTries - 1
  if (txn || remainingTries === 0) return txn

  await sleep(waitMS)

  return getTxn(anchorProvider, signature, {
    maxTries: remainingTries,
    waitMS,
  })
}

export const getTransactions = async (
  anchorProvider: AnchorProvider,
  walletAddress: string,
  mintAddress: string,
  options?: SignaturesForAddressOptions,
) => {
  try {
    const account = new PublicKey(walletAddress)
    const mint = new PublicKey(mintAddress)
    let ata = getAssociatedTokenAddressSync(mint, account)
    if (mint.equals(NATIVE_MINT)) {
      ata = account
    }
    const transactionList =
      await anchorProvider.connection.getSignaturesForAddress(ata, options)
    const sigs = transactionList.map(({ signature }) => signature)
    const transactionDetails =
      await anchorProvider.connection.getParsedTransactions(sigs, {
        maxSupportedTransactionVersion: 0,
      })

    return transactionDetails
      .map((td, idx) => solInstructionsToActivity(td, sigs[idx]))
      .filter((a) => !!a) as Activity[]
  } catch (e) {
    Logger.error(e)
    throw e as Error
  }
}

export const onAccountChange = (
  anchorProvider: AnchorProvider,
  address: string,
  callback: (address: string) => void,
) => {
  const account = new PublicKey(address)
  const conn: WrappedConnection | Connection = anchorProvider.connection

  return conn.onAccountChange(account, () => {
    callback(address)
  })
}

export const onLogs = (
  anchorProvider: AnchorProvider,
  address: string,
  callback: (address: string, log: Logs) => void,
) => {
  const account = new PublicKey(address)
  const conn = anchorProvider.connection as WrappedConnection

  return conn.onLogs(
    account,
    (log) => {
      callback(address, log)
    },
    'finalized',
  )
}

export const removeAccountChangeListener = (
  anchorProvider: AnchorProvider,
  id: number,
) => {
  const conn = anchorProvider.connection as WrappedConnection

  return conn.removeAccountChangeListener(id)
}

export const createTransferCollectableMessage = async (
  anchorProvider: AnchorProvider,
  solanaAddress: string,
  heliumAddress: string,
  collectable: Collectable | CompressedNFT,
  payee: string,
) => {
  const compressedNFT = collectable as CompressedNFT
  const nft = collectable as Collectable
  const payer = new PublicKey(solanaAddress)
  const conn = anchorProvider.connection

  const recipientPubKey = new PublicKey(payee)
  const mintPubkey = new PublicKey(nft.address || compressedNFT.id)

  const instructions: TransactionInstruction[] = []

  const ownerATA = await getAssociatedTokenAddress(mintPubkey, payer)

  const recipientATA = await getAssociatedTokenAddress(
    mintPubkey,
    recipientPubKey,
    true,
  )

  instructions.push(
    createAssociatedTokenAccountIdempotentInstruction(
      anchorProvider.publicKey,
      recipientATA,
      recipientPubKey,
      mintPubkey,
    ),
  )

  instructions.push(
    createTransferCheckedInstruction(
      ownerATA, // from (should be a token account)
      mintPubkey, // mint
      recipientATA, // to (should be a token account)
      payer, // from's owner
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
  anchorProvider: AnchorProvider,
  solanaAddress: string,
  heliumAddress: string,
  collectable: Collectable,
  payee: string,
): Promise<TransactionDraft> => {
  const payer = new PublicKey(solanaAddress)
  try {
    const recipientPubKey = new PublicKey(payee)
    const mintPubkey = new PublicKey(collectable.address)

    const instructions: TransactionInstruction[] = []

    const ownerATA = await getAssociatedTokenAddress(mintPubkey, payer)

    const recipientATA = await getAssociatedTokenAddress(
      mintPubkey,
      recipientPubKey,
      true,
    )

    instructions.push(
      createAssociatedTokenAccountIdempotentInstruction(
        anchorProvider.publicKey,
        recipientATA,
        recipientPubKey,
        mintPubkey,
      ),
    )

    instructions.push(
      createTransferCheckedInstruction(
        ownerATA, // from (should be a token account)
        mintPubkey, // mint
        recipientATA, // to (should be a token account)
        payer, // from's owner
        1, // amount
        0, // decimals
        [], // signers
      ),
    )

    return {
      instructions: await withPriorityFees({
        connection: anchorProvider.connection,
        instructions,
        feePayer: payer,
      }),
      feePayer: payer,
    }
  } catch (e) {
    Logger.error(e)
    throw new Error((e as Error).message)
  }
}

export const getAtaAccountCreationFee = async ({
  solanaAddress,
  connection,
  mint,
}: {
  solanaAddress: string
  connection: Connection
  mint: PublicKey
}) => {
  const ataAddress = getAssociatedTokenAddressSync(
    mint,
    new PublicKey(solanaAddress),
    true,
  )

  try {
    await getAccount(connection, ataAddress)
    return new BN(0)
  } catch {
    return new BN(0.00203928 * LAMPORTS_PER_SOL)
  }
}

export const mintDataCredits = async ({
  anchorProvider,
  dcAmount,
  recipient,
}: {
  anchorProvider: AnchorProvider
  dcAmount: BN
  recipient: PublicKey
}): Promise<TransactionDraft> => {
  try {
    const { publicKey: payer } = anchorProvider.wallet
    const program = await initDc(anchorProvider)

    const ix = await program.methods
      .mintDataCreditsV0({
        hntAmount: null,
        dcAmount,
      })
      .accounts({
        dcMint: DC_MINT,
        recipient,
      })
      .instruction()

    return {
      instructions: await withPriorityFees({
        connection: anchorProvider.connection,
        instructions: [ix],
        feePayer: payer,
      }),
      feePayer: payer,
    }
  } catch (e) {
    Logger.error(e)
    throw e as Error
  }
}

export const delegateDataCredits = async (
  anchorProvider: AnchorProvider,
  delegateAddress: string,
  amount: number,
  mint: PublicKey,
  memo?: string,
) => {
  try {
    const { publicKey: payer } = anchorProvider.wallet
    const program = await initDc(anchorProvider)
    const subDao = subDaoKey(mint)[0]

    const instructions: TransactionInstruction[] = []

    if (memo) {
      instructions.push(createMemoInstruction(memo, [payer]))
    }

    instructions.push(
      await program.methods
        .delegateDataCreditsV0({
          amount: new BN(amount, 0),
          routerKey: delegateAddress,
        })
        .accounts({
          subDao,
        })
        .instruction(),
    )

    return {
      instructions: await withPriorityFees({
        feePayer: payer,
        connection: anchorProvider.connection,
        instructions,
      }),
      feePayer: payer,
    }
  } catch (e) {
    Logger.error(e)
    throw e as Error
  }
}

export const getEscrowTokenAccount = (
  address: string | undefined,
  subDao: PublicKey,
) => {
  if (address) {
    try {
      const delegatedDataCredits = delegatedDataCreditsKey(subDao, address)[0]
      const escrowTokenAccount = escrowAccountKey(delegatedDataCredits)[0]

      return escrowTokenAccount
    } catch (e) {
      Logger.error(e)
      throw e as Error
    }
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
  anchorProvider: AnchorProvider,
  solanaAddress: string,
  heliumAddress: string,
  collectable: CompressedNFT,
  payee: string,
): Promise<TransactionDraft> => {
  const payer = new PublicKey(solanaAddress)
  try {
    const conn = anchorProvider.connection as WrappedConnection

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

    return {
      instructions: await withPriorityFees({
        connection: anchorProvider.connection,
        instructions,
        feePayer: payer,
      }),
      feePayer: payer,
    }
  } catch (e) {
    Logger.error(e)
    throw new Error((e as Error).message)
  }
}

export const heliumNFTs = (): string[] => {
  // HST collection ID
  const fanoutMint = membershipCollectionKey(
    fanoutKey('HST')[0],
    FanoutProgramId,
  )

  const realmHNT = PublicKey.findProgramAddressSync(
    [Buffer.from('governance', 'utf-8'), Buffer.from('Helium', 'utf-8')],
    govProgramId,
  )[0]

  const realmIOT = PublicKey.findProgramAddressSync(
    [Buffer.from('governance', 'utf-8'), Buffer.from('Helium IOT', 'utf-8')],
    govProgramId,
  )[0]

  const realmMobile = PublicKey.findProgramAddressSync(
    [Buffer.from('governance', 'utf-8'), Buffer.from('Helium MOBILE', 'utf-8')],
    govProgramId,
  )[0]

  const hntRegistrarKey = registrarKey(
    realmHNT,
    HNT_MINT,
    VoterStakeRegistryProgramId,
  )

  const iotRegistrarKey = registrarKey(
    realmIOT,
    IOT_MINT,
    VoterStakeRegistryProgramId,
  )

  const mobileRegistrarKey = registrarKey(
    realmMobile,
    MOBILE_MINT,
    VoterStakeRegistryProgramId,
  )

  // veHNT Collecion ID
  const hntRegistrarCollectionKey = registrarCollectionKey(
    hntRegistrarKey[0],
    VoterStakeRegistryProgramId,
  )

  // veIOT Collecion ID
  const iotRegistrarCollectionKey = registrarCollectionKey(
    iotRegistrarKey[0],
    VoterStakeRegistryProgramId,
  )

  // veMobile Collecion ID
  const mobileRegistrarCollectionKey = registrarCollectionKey(
    mobileRegistrarKey[0],
    VoterStakeRegistryProgramId,
  )

  return [
    fanoutMint[0].toBase58(),
    hntRegistrarCollectionKey[0].toBase58(),
    iotRegistrarCollectionKey[0].toBase58(),
    mobileRegistrarCollectionKey[0].toBase58(),
  ]
}

/**
 * Returns the account's NFTs
 * @param pubKey public key of the account
 * @param metaplex metaplex connection
 * @returns NFTs
 */
export const getNFTs = async (
  pubKey: PublicKey,
  connection: WrappedConnection,
) => {
  const approvedNFTs = heliumNFTs()

  const { items } = await connection.getAssetsByOwner<{
    items: CompressedNFT[]
  }>(
    pubKey.toBase58(),
    { sortBy: 'created', sortDirection: 'asc' },
    1000,
    1,
    '',
    '',
    { showFungible: true },
  )

  return items.filter((item) => {
    const collection = item.grouping.find(
      (k) => k.group_key === 'collection',
    )?.group_value

    return approvedNFTs.includes(collection || '')
  })
}

export const getHotspotWithRewards = async (
  assetId: PublicKey,
  anchorProvider: AnchorProvider,
): Promise<HotspotWithPendingRewards> => {
  const conn = anchorProvider.connection as WrappedConnection
  const asset = (
    await conn.getAsset<{ result: CompressedNFT }>(assetId.toBase58())
  ).result
  const [{ metadata }] = await getCompressedNFTMetadata([asset])
  return (
    await annotateWithPendingRewards(anchorProvider, [
      {
        ...asset,
        content: {
          ...asset.content,
          metadata: {
            ...asset.content.metadata,
            ...metadata,
          },
        },
      },
    ])
  )[0]
}

export const getCompressedCollectablesByCreator = async (
  pubKey: PublicKey,
  anchorProvider: AnchorProvider,
  page?: number,
  limit?: number,
) => {
  const conn = anchorProvider.connection as WrappedConnection
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const { items, ...rest } = await searchAssetsWithPageInfo(conn.rpcEndpoint, {
    ownerAddress: pubKey.toBase58(),
    creatorVerified: true,
    creatorAddress: entityCreatorKey(DAO_KEY)[0].toBase58(),
    page,
    limit,
    burnt: false,
    options: {
      showGrandTotal: true,
    },
  })

  return {
    ...rest,
    items: items.map(recursivelyConvertPubkeysToString) as CompressedNFT[],
  }
}

/**
 * Returns the account's collectables with metadata
 * @param collectables collectables without metadata
 * @returns collectables with metadata
 */
export const getNFTsMetadata = async (collectables: CompressedNFT[]) =>
  (
    await Promise.all(
      collectables.map(async (col) => {
        try {
          const { data } = await axios.get(col.content.json_uri, {
            timeout: 3000,
          })

          return { ...col, json: data }
        } catch (e: any) {
          return null
        }
      }),
    )
  ).filter(truthy)

/**
 * Returns the account's collectables grouped by token type
 * @param collectables collectables
 * @returns grouped collecables by token type
 */
export const groupNFTs = (collectables: CompressedNFT[]) => {
  const collectablesGroupedByName = collectables.reduce((acc, cur) => {
    const { symbol } = cur.content.metadata
    const collection = cur.grouping.find(
      (k) => k.group_key === 'collection',
    )?.group_value

    if (!acc[collection || symbol]) {
      acc[collection || symbol] = [cur]
    } else {
      acc[collection || symbol].push(cur)
    }
    return acc
  }, {} as Record<string, any[]>)

  return collectablesGroupedByName
}

/**
 * Returns the account's collectables grouped by token type
 * @param collectables collectables with metadata
 * @returns grouped collecables by token type
 */
export const groupNFTsWithMetaData = (collectables: CompressedNFT[]) => {
  const collectablesGroupedByName = collectables.reduce((acc, cur) => {
    const { symbol } = cur.content.metadata
    const collection = cur.grouping.find(
      (k) => k.group_key === 'collection',
    )?.group_value

    if (!acc[collection || symbol]) {
      acc[collection || symbol] = [cur]
    } else {
      acc[collection || symbol].push(cur)
    }
    return acc
  }, {} as Record<string, Collectable[]>)

  return collectablesGroupedByName
}

export const getHotspotPendingRewards = async (
  provider: AnchorProvider,
  hotspots: CompressedNFT[],
): Promise<
  {
    id: string
    pendingRewards: { [key: string]: string }
  }[]
> => {
  const program = await initLazy(provider)
  const hemProgram = await initHem(provider)
  const dao = DAO_KEY
  const keyToAssets = hotspots.map((h) => keyToAssetForAsset(toAsset(h)))
  const ktaAccs = await getCachedKeyToAssets(hemProgram as any, keyToAssets)
  const entityKeys = ktaAccs.map(
    (kta) =>
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      decodeEntityKey(kta.entityKey, kta.keySerialization)!,
  )

  const mobileRewards = await getPendingRewards(
    program,
    MOBILE_LAZY_KEY,
    dao,
    entityKeys,
    'b58',
    true,
  )

  const iotRewards = await getPendingRewards(
    program,
    IOT_LAZY_KEY,
    dao,
    entityKeys,
    'b58',
    true,
  )

  return hotspots.map((hotspot, index) => {
    const entityKey = entityKeys[index]

    return {
      id: hotspot.id,
      pendingRewards: {
        [Mints.MOBILE]: mobileRewards[entityKey],
        [Mints.IOT]: iotRewards[entityKey],
      },
    }
  })
}

export const getHotspotRecipients = async (
  provider: AnchorProvider,
  hotspots: CompressedNFT[],
): Promise<
  {
    id: string
    recipients: { [key: string]: RecipientV0 | undefined }
  }[]
> => {
  const program = await initLazy(provider)
  const hemProgram = await initHem(provider)
  const keyToAssets = hotspots.map((h) => keyToAssetForAsset(toAsset(h)))
  const ktaAccs = await getCachedKeyToAssets(hemProgram as any, keyToAssets)
  const assetKeys = ktaAccs.map((kta) => kta.asset)
  const [mobileRecipientKeys, iotRecipientKeys] = assetKeys.reduce(
    (acc: PublicKey[][], asset) => [
      [...(acc[0] || []), recipientKey(MOBILE_LAZY_KEY, asset)[0]],
      [...(acc[1] || []), recipientKey(IOT_LAZY_KEY, asset)[0]],
    ],
    [],
  )

  const mobileRecipients =
    (await program.account.recipientV0.fetchMultiple(
      mobileRecipientKeys || [],
    )) || []

  const iotRecipients =
    (await program.account.recipientV0.fetchMultiple(iotRecipientKeys || [])) ||
    []

  return hotspots.map((hotspot, index) => {
    const asset = assetKeys[index]

    return {
      id: hotspot.id,
      recipients: {
        [Mints.MOBILE]:
          (mobileRecipients?.find((r) =>
            r?.asset.equals(asset),
          ) as RecipientV0) || undefined,
        [Mints.IOT]:
          (iotRecipients?.find((r) => r?.asset.equals(asset)) as RecipientV0) ||
          undefined,
      },
    }
  })
}

/**
 * Returns the account's collectables with metadata
 * @param collectables collectables without metadata
 * @returns collectables with metadata
 */
export const getCompressedNFTMetadata = async (
  collectables: CompressedNFT[],
): Promise<{ id: string; metadata: { [key: string]: any } }[]> =>
  Promise.all(
    collectables.map(async (col) => {
      try {
        const data = await getMetadata(col.content.json_uri)
        return {
          id: col.id,
          metadata: data,
        }
      } catch (e) {
        Logger.error(e)
        return {
          id: col.id,
          metadata: {},
        }
      }
    }),
  )

export async function exists(
  connection: Connection,
  account: PublicKey,
): Promise<boolean> {
  return Boolean(await connection.getAccountInfo(account))
}

export async function getCachedKeyToAsset(
  hemProgram: Program<HeliumEntityManager>,
  keyToAsset: PublicKey,
): Promise<KeyToAssetV0 | undefined> {
  const cache = await getSingleton(hemProgram.provider.connection)
  const kta = await cache.search(
    keyToAsset,
    (pubkey, account) => ({
      pubkey,
      account,
      info: hemProgram.coder.accounts.decode<
        IdlAccounts<HeliumEntityManager>['keyToAssetV0']
      >('KeyToAssetV0', account.data),
    }),
    true,
    false,
  )

  return kta?.info
}

export async function getCachedKeyToAssets(
  hemProgram: Program<HeliumEntityManager>,
  keyToAssets: PublicKey[],
): Promise<KeyToAssetV0[]> {
  const cache = await getSingleton(hemProgram.provider.connection)
  return (
    await cache.searchMultiple(
      keyToAssets,
      (pubkey, account) => ({
        pubkey,
        account,
        info: hemProgram.coder.accounts.decode<
          IdlAccounts<HeliumEntityManager>['keyToAssetV0']
        >('KeyToAssetV0', account.data),
      }),
      true,
      false,
    )
  )
    .map((kta) => kta?.info)
    .filter(truthy)
}

export async function getCachedIotInfo(
  hemProgram: Program<HeliumEntityManager>,
  infoKey: PublicKey,
): Promise<IotHotspotInfoV0 | undefined> {
  const cache = await getSingleton(hemProgram.provider.connection)
  const iotInfo = await cache.search(
    infoKey,
    (pubkey, account) => ({
      pubkey,
      account,
      info: hemProgram.coder.accounts.decode<
        IdlAccounts<HeliumEntityManager>['iotHotspotInfoV0']
      >('IotHotspotInfoV0', account.data),
    }),
    false,
    false,
  )

  return iotInfo?.info
}

export async function getCachedIotInfos(
  hemProgram: Program<HeliumEntityManager>,
  infoKeys: PublicKey[],
): Promise<IotHotspotInfoV0[]> {
  const cache = await getSingleton(hemProgram.provider.connection)
  return (
    await cache.searchMultiple(
      infoKeys,
      (pubkey, account) => ({
        pubkey,
        account,
        info: hemProgram.coder.accounts.decode<
          IdlAccounts<HeliumEntityManager>['iotHotspotInfoV0']
        >('IotHotspotInfoV0', account.data),
      }),
      false,
      false,
    )
  )
    .map((iotInfo) => iotInfo?.info)
    .filter(truthy)
}

export async function getCachedMobileInfo(
  hemProgram: Program<HeliumEntityManager>,
  infoKey: PublicKey,
): Promise<MobileHotspotInfoV0 | undefined> {
  const cache = await getSingleton(hemProgram.provider.connection)
  const mobileInfo = await cache.search(
    infoKey,
    (pubkey, account) => ({
      pubkey,
      account,
      info: hemProgram.coder.accounts.decode<
        IdlAccounts<HeliumEntityManager>['mobileHotspotInfoV0']
      >('MobileHotspotInfoV0', account.data),
    }),
    false,
    false,
  )

  return mobileInfo?.info
}

export async function getCachedMobileInfos(
  hemProgram: Program<HeliumEntityManager>,
  infoKeys: PublicKey[],
): Promise<MobileHotspotInfoV0[]> {
  const cache = await getSingleton(hemProgram.provider.connection)
  return (
    await cache.searchMultiple(
      infoKeys,
      (pubkey, account) => ({
        pubkey,
        account,
        info: hemProgram.coder.accounts.decode<
          IdlAccounts<HeliumEntityManager>['mobileHotspotInfoV0']
        >('MobileHotspotInfoV0', account.data),
      }),
      false,
      false,
    )
  )
    .map((mobileInfo) => mobileInfo?.info)
    .filter(truthy)
}

export async function annotateWithPendingRewards(
  provider: AnchorProvider,
  hotspots: CompressedNFT[],
): Promise<HotspotWithPendingRewards[]> {
  const program = await initLazy(provider)
  const hemProgram = await initHem(provider)
  const dao = DAO_KEY
  const keyToAssets = hotspots.map((h) =>
    keyToAssetForAsset(toAsset(h as CompressedNFT)),
  )
  const ktaAccs = await getCachedKeyToAssets(hemProgram as any, keyToAssets)
  const entityKeys = ktaAccs.map(
    (kta) =>
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      decodeEntityKey(kta.entityKey, kta.keySerialization)!,
  )

  const mobileRewards = await getPendingRewards(
    program,
    MOBILE_LAZY_KEY,
    dao,
    entityKeys,
    'b58',
    true,
  )

  const iotRewards = await getPendingRewards(
    program,
    IOT_LAZY_KEY,
    dao,
    entityKeys,
    'b58',
    true,
  )

  const rewardRecipients = await getHotspotRecipients(provider, hotspots)
  const rewardRecipientsById: {
    [key: string]: { [key: string]: RecipientV0 }
  } = rewardRecipients.reduce(
    (acc, item) => ({
      ...acc,
      [item.id]: item.recipients,
    }),
    {},
  )

  return hotspots.map((hotspot, index) => {
    const entityKey = entityKeys[index]

    return {
      ...hotspot,
      pendingRewards: {
        [Mints.MOBILE]: mobileRewards[entityKey],
        [Mints.IOT]: iotRewards[entityKey],
      },
      rewardRecipients: rewardRecipientsById[hotspot.id] || {},
    } as HotspotWithPendingRewards
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
  connection: Connection,
): Promise<Collectable | null> => {
  try {
    const metadata = getMetadataId(mint)
    const metadataAccount = await connection.getAccountInfo(metadata)
    if (metadataAccount) {
      const collectable = METADATA_PARSER(metadata, metadataAccount)
      if (collectable.data.uri) {
        const json = await getMetadata(collectable.data.uri)
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return { ...collectable.data, json }
      }
    }

    return null
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
  anchorProvider: AnchorProvider,
  cluster: Cluster,
  oldestTransaction?: string,
  newestTransaction?: string,
): Promise<
  (EnrichedTransaction | (ConfirmedSignatureInfo & { signers: string[] }))[]
> => {
  const pubKey = new PublicKey(address)
  const conn = anchorProvider.connection
  const sessionKey = await getSessionKey()

  const parseTransactionsUrl = `${
    cluster === 'devnet' ? Config.DEVNET_RPC_URL : Config.MAINNET_RPC_URL
  }/v0/transactions/?session-key=${
    sessionKey || Config.RPC_SESSION_KEY_FALLBACK
  }`

  try {
    const sigs = await conn.getSignaturesForAddress(pubKey, {
      before: oldestTransaction,
      limit: 100,
      until: newestTransaction,
    })
    const sigList = sigs.map((tx) => tx.signature)
    const txs = (
      await conn.getTransactions(sigList, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0,
      })
    ).reduce((acc, tx) => {
      const sig = tx?.transaction.signatures[0]
      if (sig) {
        acc[sig] = tx
      }
      return acc
    }, {} as { [key: string]: VersionedTransactionResponse })
    const cachedLuts: { [key: string]: AddressLookupTableAccount } = {}
    // eslint-disable-next-line no-restricted-syntax
    for (const rawTx of Object.values(txs)) {
      const message = rawTx?.transaction.message
      if (message) {
        const { addressTableLookups } = message
        // eslint-disable-next-line no-restricted-syntax
        for (const addressTableLookup of addressTableLookups) {
          if (!cachedLuts[addressTableLookup.accountKey.toBase58()]) {
            const result = await conn?.getAddressLookupTable(
              addressTableLookup.accountKey,
            )
            if (result.value) {
              cachedLuts[addressTableLookup.accountKey.toBase58()] =
                result.value
            }
          }
        }
      }
    }

    // Annotate the transactions with their signers
    const txList = await Promise.all(
      sigs.map(async (tx) => {
        // Yes, this is extremely gross. It's also the only way to get the signers
        // on a versioned tx.
        const rawTx = txs[tx.signature]
        const message = rawTx?.transaction.message
        if (message) {
          const { addressTableLookups } = message
          const addressLookupTableAccounts: Array<AddressLookupTableAccount> =
            []
          // eslint-disable-next-line no-restricted-syntax
          for (const addressTableLookup of addressTableLookups) {
            addressLookupTableAccounts.push(
              cachedLuts[addressTableLookup.accountKey.toBase58()],
            )
          }
          const accountKeys = message.getAccountKeys({
            addressLookupTableAccounts,
          })
          return {
            ...tx,
            signers: [
              ...new Set(
                message.compiledInstructions
                  .map((ix) =>
                    ix.accountKeyIndexes.filter((idx) =>
                      message.isAccountSigner(idx),
                    ),
                  )
                  .flat(),
              ),
            ]
              .map((idx) => accountKeys.get(idx)?.toBase58())
              .filter(truthy),
          }
        }

        return {
          ...tx,
          signers: [],
        }
      }),
    )

    if (cluster !== 'mainnet-beta' && cluster !== 'devnet') {
      return txList
    }

    const { data } = await axios.post(parseTransactionsUrl, {
      transactions: sigList,
    })

    const allTxnsWithMetadata: EnrichedTransaction[] = await Promise.all(
      data.map(async (tx: EnrichedTransaction, index: number) => {
        // eslint-disable-next-line no-param-reassign
        tx.signers = txList[index].signers
        try {
          const firstTokenTransfer = tx.tokenTransfers[0]
          if (firstTokenTransfer && firstTokenTransfer.mint) {
            const tokenMetadata = await getCollectableByMint(
              new PublicKey(firstTokenTransfer.mint),
              conn,
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

    // Combine and sort all txns by date in descending order
    allTxnsWithMetadata.sort(
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

    return allTxnsWithMetadata
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
  amount: number,
  fromMint: PublicKey,
  anchorProvider: AnchorProvider,
  recipient: PublicKey,
): Promise<TransactionDraft> {
  const conn = anchorProvider.connection
  try {
    const program = await initTm(anchorProvider)
    const fromMintAcc = await getMint(conn, fromMint)
    const treasuryManagement = treasuryManagementKey(fromMint)[0]

    const ix = await program.methods
      .redeemV0({
        amount: toBN(amount, fromMintAcc.decimals),
        expectedOutputAmount: new BN(0),
      })
      .preInstructions([
        ComputeBudgetProgram.setComputeUnitLimit({ units: 350000 }),
      ])
      .accounts({
        treasuryManagement,
        to: getAssociatedTokenAddressSync(HNT_MINT, recipient, true),
      })
      .instruction()

    return {
      instructions: await withPriorityFees({
        connection: conn,
        instructions: [ix],
        feePayer: anchorProvider.wallet.publicKey,
      }),
      feePayer: anchorProvider.wallet.publicKey,
    }
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
  amount: number,
  fromMint: PublicKey,
  anchorProvider: AnchorProvider,
  recipient: PublicKey,
) {
  const conn = anchorProvider.connection

  try {
    const program = await initTm(anchorProvider)
    const fromMintAcc = await getMint(conn, fromMint)
    const treasuryManagement = treasuryManagementKey(fromMint)[0]

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
        to: getAssociatedTokenAddressSync(HNT_MINT, recipient, true),
      })
      .transaction()

    const { blockhash } = await conn.getLatestBlockhash('recent')

    const message = new TransactionMessage({
      payerKey: anchorProvider.publicKey,
      recentBlockhash: blockhash,
      instructions: [...tx.instructions],
    }).compileToLegacyMessage()

    const transaction = new VersionedTransaction(
      VersionedMessage.deserialize(message.serialize()),
    )

    return transaction.serialize()
  } catch (e) {
    Logger.error(e)
    throw e as Error
  }
}

// TODO: Use enriched txns instead of manually parsing txns
export const solInstructionsToActivity = (
  parsedTxn: ParsedTransactionWithMeta | null,
  signature: string,
) => {
  if (!parsedTxn) return

  const activity: Activity = { hash: signature, type: 'unknown' }

  const { slot, blockTime, meta } = parsedTxn

  activity.fee = meta?.fee
  activity.height = slot
  activity.feePayer =
    parsedTxn.transaction.message.accountKeys[0].pubkey.toBase58()

  if (blockTime) {
    activity.time = blockTime
  }
  if (meta?.preBalances && meta.postBalances) {
    const { preBalances, postBalances } = meta

    let payments = [] as Payment[]
    postBalances.forEach((post, index) => {
      const preBalance = preBalances[index]
      const pre = preBalance || 0
      const preAmount = pre || 0
      const postAmount = post || 0
      const amount = postAmount - preAmount
      if (amount !== 0 && !Number.isNaN(amount)) {
        const p: Payment = {
          amount: amount / LAMPORTS_PER_SOL,
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          owner:
            parsedTxn.transaction.message.accountKeys[index].pubkey.toBase58(),
          mint: NATIVE_MINT.toBase58(),
        }
        payments = [...payments, p]
      }
    })
    activity.payments = [...payments, ...(activity.payments || [])]
  }
  if (meta?.preTokenBalances && meta.postTokenBalances) {
    const { preTokenBalances, postTokenBalances } = meta

    let payments = [] as Payment[]
    postTokenBalances.forEach((post) => {
      const preBalance = preTokenBalances.find(
        ({ accountIndex }) => accountIndex === post.accountIndex,
      )
      const pre = preBalance || {
        uiTokenAmount: { uiAmount: 0 },
        owner: post.owner,
      }
      const preAmount = pre.uiTokenAmount.uiAmount || 0
      const postAmount = post.uiTokenAmount.uiAmount || 0
      const amount = postAmount - preAmount
      if (amount !== 0 && !Number.isNaN(amount)) {
        const p: Payment = {
          amount,
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          owner: (post.owner || pre.owner)!,
          mint: post.mint,
        }
        payments = [...payments, p]
      }
    })
    activity.payments = [...payments, ...(activity.payments || [])]
  }

  if ((activity.payments?.length || 0) > 0) {
    // We have a payment
    activity.type = 'payment_v2'
  }

  if (activity.type === 'unknown') return

  return activity
}

export const submitSolana = async ({
  txn,
  anchorProvider,
}: {
  txn: Buffer
  anchorProvider: AnchorProvider
}) => {
  const conn = anchorProvider.connection
  const { txid } = await sendAndConfirmWithRetry(
    conn,
    txn,
    { skipPreflight: true },
    'confirmed',
  )

  return txid
}

export const parseTransactionError = (balance?: BN, message?: string) => {
  if (balance?.lt(new BN(0.02))) {
    return 'The SOL balance on this account is too low to complete this transaction'
  }

  return message
}

/**
 * Returns the current transactions per second (TPS) rate — including voting transactions.
 *
 * @returns {Promise<number>} A promise that resolves to the current TPS rate.
 * @throws {Error} If there was an error calling the `getRecentPerformanceSamples` method.
 */
export const getCurrentTPS = async (
  connection: WrappedConnection,
): Promise<number> => {
  try {
    const samples = await connection.getRecentPerformanceSamples(1)
    return samples[0]?.numTransactions / samples[0]?.samplePeriodSecs
  } catch (e) {
    throw new Error(`error calling getCurrentTPS: ${e}`)
  }
}

export const calcCreateAssociatedTokenAccountAccountFee = async (
  provider: AnchorProvider,
  payee: string,
  mint: PublicKey,
): Promise<BN> => {
  if (!payee) {
    return new BN(0)
  }

  if (!solAddressIsValid(payee)) {
    return new BN(0)
  }

  const payeePubKey = new PublicKey(payee)
  const ata = await getAssociatedTokenAddress(mint, payeePubKey, true)
  if (ata) {
    return new BN(0)
  }

  const transaction = new Transaction().add(
    createAssociatedTokenAccountInstruction(
      provider.publicKey,
      HNT_MINT,
      payeePubKey,
      HNT_MINT,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID,
    ),
  )

  try {
    const { blockhash } = await provider.connection.getLatestBlockhash('recent')

    transaction.recentBlockhash = blockhash
    transaction.feePayer = provider.publicKey

    const fee = await transaction.getEstimatedFee(provider.connection)

    if (!fee) {
      return new BN(0)
    }
    return new BN(fee)
  } catch (e) {
    return new BN(0)
  }
}

export function toAsset(hotspot: CompressedNFT): Asset {
  return {
    ...hotspot,
    id: new PublicKey(hotspot.id),
    creators: hotspot.creators.map((c) => ({
      ...c,
      address: new PublicKey(c.address),
    })),
    grouping:
      hotspot.grouping &&
      hotspot.grouping.map((g) => ({
        ...g,
        group_value: new PublicKey(g.group_value),
      })),
    compression: {
      ...hotspot.compression,
      leafId: hotspot.compression.leaf_id,
      dataHash: Buffer.from(bs58.decode(hotspot.compression.data_hash)),
      creatorHash: Buffer.from(bs58.decode(hotspot.compression.creator_hash)),
      assetHash: Buffer.from(bs58.decode(hotspot.compression.asset_hash)),
      tree: new PublicKey(hotspot.compression.tree),
    },
    ownership: {
      ...hotspot.ownership,
      delegate:
        hotspot.ownership.delegate && new PublicKey(hotspot.ownership.delegate),
      owner: new PublicKey(hotspot.ownership.owner),
    },
  }
}

function recursivelyConvertPubkeysToString(value: any): any {
  if (value && value.toBase58) {
    return value.toBase58()
  }

  if (Array.isArray(value)) {
    return value.map(recursivelyConvertPubkeysToString)
  }

  if (typeof value === 'object' && value !== null) {
    const newObj: any = {}
    // eslint-disable-next-line no-restricted-syntax, guard-for-in
    for (const key in value) {
      newObj[key] = recursivelyConvertPubkeysToString(value[key])
    }
    return newObj
  }
  return value
}

export const createUpdateCompressionDestinationTxn = async (
  anchorProvider: AnchorProvider,
  lazyDistributors: PublicKey[],
  payer: PublicKey,
  assetId: PublicKey,
  destination: PublicKey,
): Promise<TransactionDraft> => {
  const program = await initLazy(anchorProvider)
  const {
    asset: {
      ownership: { owner },
    },
    args,
    accounts,
    remainingAccounts,
  } = await proofArgsAndAccounts({
    connection: program.provider.connection,
    assetId,
  })

  const instructions: TransactionInstruction[] = (
    await Promise.all(
      lazyDistributors.map(async (lazy) => {
        const [recipientPk] = recipientKey(lazy, assetId)
        const recipientExists = await exists(
          anchorProvider.connection,
          recipientPk,
        )

        const ixs = []
        if (!recipientExists) {
          ixs.push(
            await (
              await initializeCompressionRecipient({
                program,
                assetId,
                lazyDistributor: lazy,
                payer,
              })
            ).instruction(),
          )
        }
        ixs.push(
          await program.methods
            .updateCompressionDestinationV0({
              ...args,
            })
            .accounts({
              ...accounts,
              owner,
              recipient: recipientKey(lazy, assetId)[0],
              destination:
                destination == null ? PublicKey.default : destination,
            })
            .remainingAccounts(remainingAccounts)
            .instruction(),
        )
        return ixs
      }),
    )
  ).flat()

  return {
    instructions: await withPriorityFees({
      connection: anchorProvider.connection,
      instructions,
      feePayer: payer,
    }),
    feePayer: payer,
  }
}
