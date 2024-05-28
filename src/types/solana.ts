import { init as initHsd } from '@helium/helium-sub-daos-sdk'
import { init as initDc } from '@helium/data-credits-sdk'
import { init as initHem } from '@helium/helium-entity-manager-sdk'
import { init as initLazy } from '@helium/lazy-distributor-sdk'
import { TokenAmount } from '@solana/web3.js'
import { Creator } from '@metaplex-foundation/mpl-bubblegum'
import { RecipientV0 } from '@hooks/useRecipient'

export type HotspotWithPendingRewards = CompressedNFT & {
  // mint id to pending rewards
  pendingRewards: Record<string, string> | undefined
  rewardRecipients: Record<string, RecipientV0 | undefined>
}

export type HemProgram = Awaited<ReturnType<typeof initHem>>
export type DcProgram = Awaited<ReturnType<typeof initDc>>
export type LazyProgram = Awaited<ReturnType<typeof initLazy>>
export type HsdProgram = Awaited<ReturnType<typeof initHsd>>

export type SolPayment = {
  destination: string
  mint: string
  multisigAuthority: string
  signers: string[]
  source: string
  tokenAmount: TokenAmount
}
export type SolPaymentInfo = {
  account: string
  mint: string
  source: string
  systemProgram: string
  tokenProgram: string
  wallet: string
}

export type CompressedNFT = {
  interface: string
  id: string
  content: {
    $schema: string
    json_uri: string
    files: {
      uri: string
      mime: string
    }[]
    metadata: any
  }
  authorities: {
    address: string
    scopes: string[]
  }[]
  compression: {
    eligible: boolean
    compressed: boolean
    data_hash: string
    creator_hash: string
    asset_hash: string
    tree: string
    seq: number
    leaf_id: number
  }
  grouping: any[]
  royalty: {
    royalty_model: string
    target: any
    percent: number
    basis_points: number
    primary_sale_happened: boolean
    locked: boolean
  }
  creators: Creator[]
  ownership: {
    frozen: boolean
    delegated: boolean
    delegate: any
    ownership_model: string
    owner: string
  }
  supply: {
    print_max_supply: number
    print_current_supply: number
    edition_nonce: number
  }
  mutable: boolean
}

export type Collectable = any

type NativeTransfer = {
  fromUserAccount: string
  toUserAccount: string
  amount: number
}

type TokenMetadata = {
  model: string
  name: string
  symbol: string
  uri: string
  json: any | undefined
}

type TokenTransfer = {
  fromUserAccount: string
  toUserAccount: string
  fromTokenAccount: string
  toTokenAccount: string
  tokenAmount: number
  mint: string
  tokenMetadata?: TokenMetadata
}

type TokenBalanceChange = {
  userAccount: string
  tokenAccount: string
  mint: string
  rawTokenAmount: {
    tokenAmount: string
    decimals: number
  }
}

type TokenPayload = {
  userAccount: string
  tokenAccount: string
  mint: string
  rawTokenAmount: {
    tokenAmount: string
    decimals: number
  }
}

type NativeTokenPayload = {
  account: string
  amount: number
}

export type EnrichedTransaction = {
  signers: string[]
  description: string
  type: string
  source: string
  fee: number
  signature: string
  slot: number
  timestamp: number
  transactionError: any
  nativeTransfers: NativeTransfer[]
  tokenTransfers: TokenTransfer[]
  accountData: {
    account: string
    nativeBalanceChange: number
    tokenBalanceChanges: TokenBalanceChange[]
  }
  events: {
    compressed: [
      {
        assetId: string
        innerInstructionIndex: number
        instructionIndex: number
        leafIndex: number
        treeId: string
        type: string
        metadata: any
      },
      {
        assetId: string
        innerInstructionIndex: number
        instructionIndex: number
        leafIndex: number
        treeId: string
        type: string
      },
    ]
    nft: {
      description: string
      type: string
      source: string
      amount: number
      fee: number
      signature: string
      timestamp: number
      saleType: string
      buyer: string
      seller: string
      staker: string
      nfts: {
        mint: string
        tokenStandard: string
      }[]
    }
    swap: {
      nativeInput: NativeTokenPayload
      nativeOutput: NativeTokenPayload
      tokenInputs: TokenPayload[]
      tokenOutputs: TokenPayload[]
      tokenFees: TokenPayload[]
      nativeFees: NativeTokenPayload[]
      innerSwaps: {
        tokenInputs: TokenPayload[]
        tokenOutputs: TokenPayload[]
        tokenFees: TokenPayload[]
        nativeFees: NativeTokenPayload[]
        programInfo: {
          source: string
          account: string
          programName: string
          instructionName: string
        }
      }
    }
  }
}
