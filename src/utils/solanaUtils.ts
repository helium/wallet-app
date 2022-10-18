import * as web3 from '@solana/web3.js'
import Address from '@helium/address'
import {
  TOKEN_PROGRAM_ID,
  AccountLayout,
  createTransferCheckedInstruction,
  getOrCreateAssociatedTokenAccount,
} from '@solana/spl-token'
import Balance, { AnyCurrencyType } from '@helium/currency'
import { getKeypair } from '../storage/secureStorage'

const conn = new web3.Connection(web3.clusterApiUrl('devnet'))

export const Mint = {
  HNT: new web3.PublicKey('hntg4GdrpMBW8bqs4R2om4stE6uScPRhPKWAarzoWKP'),
  MOBILE: new web3.PublicKey('mob1r1x3raXXoH42RZwxTxgbAuKkBQzTAQqSjkUdZbd'),
  DC: new web3.PublicKey('dcr5SHHfQixyb5YT7J1hgbWvgxvBpn65bpCyx6pTiKo'),
} as const

export const solKeypairFromPK = (heliumPK: Buffer) => {
  return web3.Keypair.fromSecretKey(heliumPK)
}

export const heliumAddressToSolAddress = (heliumAddress: string) => {
  if (typeof heliumAddress !== 'string') return ''
  const heliumPK = Address.fromB58(heliumAddress).publicKey
  const pk = new web3.PublicKey(heliumPK)
  return pk.toBase58()
}

export const solAddressIsValid = (address: string) => {
  try {
    const pubKey = new web3.PublicKey(address)
    return web3.PublicKey.isOnCurve(pubKey)
  } catch {
    return false
  }
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
  const confirmation = await conn.confirmTransaction({
    signature,
    blockhash,
    lastValidBlockHeight,
  })

  if (confirmation.value.err) {
    throw new Error(confirmation.value.err.toString())
  }

  return `https://explorer.solana.com/tx/${signature}?cluster=devnet`
}

export const confirmTxn = async (signature: string) => {
  const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash()

  return conn.confirmTransaction({
    blockhash,
    lastValidBlockHeight,
    signature,
  })
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
