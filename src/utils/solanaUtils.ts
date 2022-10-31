import * as web3 from '@solana/web3.js'
import {
  TOKEN_PROGRAM_ID,
  AccountLayout,
  createTransferCheckedInstruction,
  getOrCreateAssociatedTokenAccount,
  getAssociatedTokenAddress,
} from '@solana/spl-token'
import Balance, { AnyCurrencyType } from '@helium/currency'
import { getKeypair } from '../storage/secureStorage'
import solInstructionsToActivity from './solInstructionsToActivity'
import { Activity } from '../types/activity'
import sleep from './sleep'
import { Mints } from '../store/slices/walletRestApi'

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

export const removeAccountChangeListener = (
  cluster: web3.Cluster,
  id: number,
) => {
  return getConnection(cluster).removeAccountChangeListener(id)
}
