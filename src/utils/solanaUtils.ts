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
import { Mint, tokenTypeToMint } from '../types/solana'
import { Activity, TokenType } from '../types/activity'
import sleep from './sleep'

const conn = new web3.Connection(web3.clusterApiUrl('devnet'))

export const solKeypairFromPK = (heliumPK: Buffer) => {
  return web3.Keypair.fromSecretKey(heliumPK)
}

export const airdrop = (address: string) => {
  const key = new web3.PublicKey(address)
  return conn.requestAirdrop(key, web3.LAMPORTS_PER_SOL)
}

export const readHeliumBalances = async (address: string) => {
  const account = new web3.PublicKey(address)

  const tokenAccounts = await conn.getTokenAccountsByOwner(account, {
    programId: TOKEN_PROGRAM_ID,
  })

  const vals = {} as Record<string, bigint>
  tokenAccounts.value.forEach((tokenAccount) => {
    const accountData = AccountLayout.decode(tokenAccount.account.data)
    vals[accountData.mint.toBase58()] = accountData.amount
  })

  return {
    hntBalance: vals[Mint.HNT.toBase58()],
    mobileBalance: vals[Mint.MOBILE.toBase58()],
    dcBalance: vals[Mint.DC.toBase58()],
  }
}

export const readSolanaBalance = async (address: string) => {
  const key = new web3.PublicKey(address)
  return conn.getBalance(key)
}

export const transferToken = async (
  solanaAddress: string,
  heliumAddress: string,
  payments: {
    payee: string
    balanceAmount: Balance<AnyCurrencyType>
    memo: string
    max?: boolean
  }[],
) => {
  if (!payments.length) throw new Error('No payment found')

  const payer = new web3.PublicKey(solanaAddress)
  const secureAcct = await getKeypair(heliumAddress)

  if (!secureAcct) {
    throw new Error('Secure account not found')
  }

  const signer = {
    publicKey: payer,
    secretKey: secureAcct.privateKey,
  }
  let mint: web3.PublicKey = Mint.HNT
  const [firstPayment] = payments

  switch (firstPayment.balanceAmount.type.ticker) {
    case 'DC': {
      mint = Mint.DC
      break
    }
    case 'HNT': {
      mint = Mint.HNT
      break
    }
    case 'MOBILE': {
      mint = Mint.MOBILE
      break
    }
    default:
      throw new Error('Token type not found')
  }

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

  const { blockhash } = await conn.getLatestBlockhash()

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

  // The web3.sendAndConfirmTransaction socket connection occassionally blows up with the error
  // signatureSubscribe error for argument ["your_signature", {"commitment": "finalized"}] INVALID_STATE_ERR
  // Just going to poll for the txn for now 👇
  const txn = await getTxn(signature, { maxTries: 10 })

  if (txn?.meta?.err) {
    throw new Error(txn.meta.err.toString())
  }

  return txn
}

export const getTxn = async (
  signature: string,
  config?: { maxTries?: number; waitMS?: number },
): Promise<web3.VersionedTransactionResponse | null> => {
  const maxTries = config?.maxTries || 1
  const waitMS = config?.waitMS || 500

  const txn = await conn.getTransaction(signature, {
    maxSupportedTransactionVersion: 0,
  })

  const remainingTries = maxTries - 1
  if (txn || remainingTries === 0) return txn

  await sleep(waitMS)

  return getTxn(signature, { maxTries, waitMS })
}

export const confirmTxn = async (signature: string) => {
  const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash()

  return conn.confirmTransaction({
    blockhash,
    lastValidBlockHeight,
    signature,
  })
}

export const getTransactions = async (
  walletAddress: string,
  tokenType: TokenType,
  options?: web3.SignaturesForAddressOptions,
) => {
  const account = new web3.PublicKey(walletAddress)
  const mint = tokenTypeToMint(tokenType)
  const ata = await getAssociatedTokenAddress(mint, account)
  const transactionList = await conn.getSignaturesForAddress(ata, options)
  const sigs = transactionList.map(({ signature }) => signature)

  const transactionDetails = await conn.getParsedTransactions(sigs, {
    maxSupportedTransactionVersion: 0,
  })

  return transactionDetails
    .map((td, idx) => solInstructionsToActivity(td, sigs[idx]))
    .filter((a) => !!a) as Activity[]
}

export const onAccountChange = (
  address: string,
  callback: (address: string) => void,
) => {
  const account = new web3.PublicKey(address)
  return conn.onAccountChange(account, () => {
    callback(address)
  })
}

export const removeAccountChangeListener = (id: number) => {
  return conn.removeAccountChangeListener(id)
}
