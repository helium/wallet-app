import {
  BorshInstructionCoder,
  Program,
  Instruction,
  BN,
} from '@coral-xyz/anchor'
import { PublicKey } from '@solana/web3.js'
import { useCallback, useMemo, useRef, useState } from 'react'
import * as web3 from '@solana/web3.js'
import { useAsync } from 'react-async-hook'
import bs58 from 'bs58'
import { get, last } from 'lodash'
import { SignHotspotResponse } from '@helium/wallet-link'
import { getLeafAssetId } from '@metaplex-foundation/mpl-bubblegum'
import {
  Balance,
  CurrencyType,
  DataCredits,
  NetworkTokens,
} from '@helium/currency'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { submitSolana } from '../../utils/solanaUtils'
import { getSolanaKeypair } from '../../storage/secureStorage'
import { Asset, WrappedConnection } from '../../utils/WrappedConnection'
import { heliumAddressToSolAddress } from '../../utils/accountUtils'

const ValidTxnKeys = [
  'onboardIotHotspotV0',
  'onboardMobileHotspotV0',
  'updateMobileInfoV0',
  'updateIotInfoV0',
  'transfer',
  'mintDataCreditsV0',
] as const
export type ValidTxn = typeof ValidTxnKeys[number]
type Txn = {
  transaction: web3.Transaction
  gatewayAddress?: string
  location?: string
  elevation?: number
  gain?: number
  newOwner?: string
  owner?: string
  dcFee?: Balance<DataCredits> | null
  hntFee?: Balance<NetworkTokens> | null
}

const useSolTxns = (heliumAddress: string, solanaTransactions?: string) => {
  const { anchorProvider } = useAccountStorage()
  const [submitLoading, setSubmitLoading] = useState(false)
  const handledTxnStr = useRef('')
  const [transactions, setTransactions] = useState<
    Partial<Record<ValidTxn, Txn>>
  >({} as Record<ValidTxn, Txn>)

  const transactionList = useMemo(() => {
    const keys = ValidTxnKeys.filter((k) => k !== 'mintDataCreditsV0')

    let list = keys.flatMap((k) => {
      const t = transactions[k]
      if (!t) return []
      return [t]
    })

    // Minting of dc needs to be submitted first
    if (transactions.mintDataCreditsV0) {
      list = [transactions.mintDataCreditsV0, ...list]
    }
    return list
  }, [transactions])

  const fetchIdl = useCallback(
    async (pubkey: PublicKey) => {
      const idl = await Program.fetchIdl(pubkey, anchorProvider)
      if (!idl) throw new Error(`Could not find idl for${pubkey.toBase58()}`)
      return idl
    },
    [anchorProvider],
  )

  const handleOnboard = useCallback(
    async ({
      decodedInstruction,
      instruction,
      coder,
      connection,
    }: {
      decodedInstruction: Instruction
      instruction: web3.TransactionInstruction
      coder: BorshInstructionCoder
      connection: web3.Connection
    }) => {
      const formatted = coder.format(decodedInstruction, instruction.keys)
      const keyToAssetAccount = formatted?.accounts.find(
        ({ name }) => name === 'Key To Asset',
      )
      if (!keyToAssetAccount) return {}

      const sigs = await connection.getSignaturesForAddress(
        new PublicKey(keyToAssetAccount.pubkey),
      )

      const signature = last(sigs)?.signature
      if (!signature) return {}

      const getTransactionWithInstruction =
        await connection.getParsedTransaction(signature)

      const instructions =
        getTransactionWithInstruction?.transaction.message.instructions
      if (!instructions || !instructions.length) {
        return {}
      }

      const bs58Decoded = bs58.decode(
        (last(instructions) as web3.PartiallyDecodedInstruction).data,
      )
      const decodedBs58Instruction = coder.decode(Buffer.from(bs58Decoded))
      if (!decodedBs58Instruction) {
        return {}
      }

      const entityKey = get(decodedBs58Instruction, 'data.args.entityKey')

      const gatewayAddress = bs58.encode(entityKey)

      const { location, elevation, gain } = get(
        decodedInstruction,
        'data.args',
      ) as {
        location: BN
        elevation: number
        gain: number
        index: number
      }

      return {
        name: decodedInstruction.name || '',
        gatewayAddress,
        location: location.toString('hex'),
        elevation,
        gain,
      }
    },
    [],
  )

  const handleUpdateMeta = useCallback(
    async ({
      decodedInstruction,
      instruction,
      connection,
      coder,
    }: {
      coder: BorshInstructionCoder
      decodedInstruction: Instruction
      instruction: web3.TransactionInstruction
      connection: WrappedConnection
    }) => {
      const formatted = coder.format(decodedInstruction, instruction.keys)

      const merkleTreeAccount = formatted?.accounts.find(
        ({ name }) => name === 'Merkle Tree',
      )
      if (!merkleTreeAccount) {
        throw new Error('Failed to format instruction')
      }

      const { location, elevation, gain, index } = get(
        decodedInstruction,
        'data.args',
      ) as {
        location: BN
        elevation: number
        gain: number
        index: number
      }

      const pubKey = await getLeafAssetId(
        merkleTreeAccount.pubkey,
        new BN(index),
      )
      const response = await connection.getAsset<Asset>(pubKey.toString())

      const gatewayAddress = response.result.content.json_uri
        .split('/')
        .slice(-1)[0]

      return {
        location: location.toString('hex'),
        elevation,
        gain,
        name: decodedInstruction.name,
        gatewayAddress,
      }
    },
    [],
  )

  const handleTransfer = useCallback(
    async ({
      decodedInstruction,
      instruction,
      connection,
      coder,
    }: {
      coder: BorshInstructionCoder
      decodedInstruction: Instruction
      instruction: web3.TransactionInstruction
      connection: WrappedConnection
    }) => {
      const formatted = coder.format(decodedInstruction, instruction.keys)
      const newOwnerAcct = formatted?.accounts.find(
        ({ name }) => name === 'New Leaf Owner',
      )

      const ownerAcct = formatted?.accounts.find(
        ({ name }) => name === 'Leaf Owner',
      )

      if (!newOwnerAcct || !ownerAcct) {
        throw new Error('Failed to format instruction')
      }

      const solAddress = heliumAddressToSolAddress(heliumAddress)
      if (solAddress !== ownerAcct.pubkey.toBase58()) {
        throw new Error('Invalid transactions')
      }

      const merkleTreeAccount = formatted?.accounts.find(
        ({ name }) => name === 'Merkle Tree',
      )
      if (!merkleTreeAccount) {
        throw new Error('Failed to format instruction')
      }

      const index = get(decodedInstruction, 'data.index') as number
      const pubKey = await getLeafAssetId(
        merkleTreeAccount.pubkey,
        new BN(index),
      )
      const asset = await connection.getAsset<Asset>(pubKey.toString())

      const gatewayAddress = asset.result.content.json_uri
        .split('/')
        .slice(-1)[0]

      return {
        owner: ownerAcct.pubkey.toBase58(),
        newOwner: newOwnerAcct.pubkey.toBase58(),
        name: decodedInstruction.name,
        gatewayAddress,
      }
    },
    [heliumAddress],
  )

  const handleBurn = useCallback(
    async ({
      decodedInstruction,
    }: {
      coder: BorshInstructionCoder
      decodedInstruction: Instruction
      instruction: web3.TransactionInstruction
      connection: WrappedConnection
    }) => {
      const data = decodedInstruction.data as {
        args: { dcAmount: string | null; hntAmount: string | null }
      }

      let dcFee = 0
      let hntFee = 0
      if (data.args.dcAmount) {
        dcFee = new BN(data.args.dcAmount).toNumber()
      }
      if (data.args.hntAmount) {
        hntFee = new BN(data.args.hntAmount).toNumber()
      }
      return {
        hntFee: new Balance(hntFee, CurrencyType.networkToken),
        dcFee: new Balance(dcFee, CurrencyType.dataCredit),
        name: decodedInstruction.name,
      }
    },
    [],
  )

  const decode = useCallback(
    async (instruction: web3.TransactionInstruction) => {
      if (!anchorProvider) return
      const connection = anchorProvider.connection as WrappedConnection

      try {
        const idl = await fetchIdl(instruction.programId)
        const coder = new BorshInstructionCoder(idl)
        const decodedInstruction = coder.decode(instruction.data)

        if (!decodedInstruction) return {}

        switch (decodedInstruction.name as ValidTxn) {
          case 'onboardIotHotspotV0':
          case 'onboardMobileHotspotV0':
            return await handleOnboard({
              decodedInstruction,
              instruction,
              coder,
              connection,
            })

          case 'updateIotInfoV0':
          case 'updateMobileInfoV0':
            return await handleUpdateMeta({
              decodedInstruction,
              instruction,
              connection,
              coder,
            })
          case 'transfer':
            return await handleTransfer({
              decodedInstruction,
              instruction,
              connection,
              coder,
            })

          case 'mintDataCreditsV0':
            return await handleBurn({
              decodedInstruction,
              instruction,
              connection,
              coder,
            })
        }
      } catch (e) {
        return {}
      }
    },
    [
      fetchIdl,
      handleBurn,
      handleOnboard,
      handleTransfer,
      handleUpdateMeta,
      anchorProvider,
    ],
  )

  const handleTransaction = useCallback(
    async (txn: web3.Transaction) => {
      const info = await Promise.all(
        txn.instructions.map(async (instruction) => decode(instruction)),
      )
      return { info, txn }
    },
    [decode],
  )

  useAsync(async () => {
    if (!solanaTransactions || handledTxnStr.current === solanaTransactions)
      return

    const txns = solanaTransactions
      .split(',')
      .map((t) => web3.Transaction.from(Buffer.from(t, 'base64')))

    if (!txns?.length) return

    handledTxnStr.current = solanaTransactions

    const handledTxns = await Promise.all(txns.map(handleTransaction))
    const nextRecord = {} as Record<ValidTxn, Txn>
    handledTxns.forEach(({ txn, info }) => {
      info.forEach((i) => {
        if (i) {
          const name = i.name as ValidTxn
          if (ValidTxnKeys.includes(name)) {
            nextRecord[name] = { transaction: txn, ...i }
          }
        }
      })
    })

    setTransactions(nextRecord)
  }, [solanaTransactions])

  const gatewayAddress = useMemo(() => {
    if (Object.keys(transactions).length) {
      return (
        transactions.onboardIotHotspotV0?.gatewayAddress ||
        transactions.onboardMobileHotspotV0?.gatewayAddress ||
        transactions.updateIotInfoV0?.gatewayAddress ||
        transactions.updateMobileInfoV0?.gatewayAddress ||
        transactions.transfer?.gatewayAddress
      )
    }
  }, [transactions])

  const burnAmounts = useMemo(() => {
    if (!transactions.mintDataCreditsV0) return

    return {
      dcFee: transactions.mintDataCreditsV0.dcFee,
      hntFee: transactions.mintDataCreditsV0.hntFee,
    }
  }, [transactions.mintDataCreditsV0])

  const sign = useCallback(
    async (
      callback: (responseParams: SignHotspotResponse) => Promise<void>,
    ) => {
      const signer = await getSolanaKeypair(heliumAddress)
      if (!signer) {
        callback({ status: 'token_not_found' })
        throw new Error('Failed to sign transfer txn')
      }

      const responseParams = {
        status: 'success',
        gatewayAddress,
      } as SignHotspotResponse

      const txnList = transactionList.map(({ transaction: tx }) => {
        tx.partialSign(signer)
        return tx.serialize().toString('base64')
      })

      responseParams.solanaTransactions = txnList.join(',')
      callback(responseParams)
    },
    [gatewayAddress, heliumAddress, transactionList],
  )

  const assertData = useMemo(() => {
    let location: string | undefined
    let elevation: number | undefined
    let gain: number | undefined

    transactionList.forEach((t) => {
      if (t.location) {
        location = t.location
      }
      if (t.elevation && t.elevation > 0) {
        elevation = t.elevation
      }

      if (t.gain && t.gain > 0) {
        gain = t.gain / 10
      }
    })

    return { location, elevation, gain }
  }, [transactionList])

  const transferData = useMemo((): { newOwner: string } | undefined => {
    const key = ValidTxnKeys.find((k) => {
      const data = transactions[k]
      return !!data?.newOwner
    })
    if (!key) return
    const txn = transactions[key]
    return { newOwner: txn?.newOwner || '' }
  }, [transactions])

  const hasTransactions = useMemo(() => !!gatewayAddress, [gatewayAddress])

  const submit = useCallback(async () => {
    if (!anchorProvider) return

    setSubmitLoading(true)
    const txnBuffs = transactionList.map(({ transaction }) =>
      transaction.serialize(),
    )

    // TODO: Confirm this works
    const ids = await Promise.all(
      txnBuffs.map((txn) => submitSolana({ anchorProvider, txn })),
    )
    setSubmitLoading(false)
    return ids
  }, [anchorProvider, transactionList])

  return {
    assertData,
    burnAmounts,
    decode,
    fetchIdl,
    gatewayAddress,
    hasTransactions,
    sign,
    submit,
    submitLoading,
    transactions,
    transferData,
  }
}

export default useSolTxns
