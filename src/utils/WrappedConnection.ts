/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Commitment,
  Connection,
  ConnectionConfig,
  FetchFn,
} from '@solana/web3.js'
import * as logger from '@utils/logger'
import axios from 'axios'
import type { CompressedNFT } from '../types/solana'

export type SearchAssetsOpts = {
  sortBy?: { sortBy: 'created'; sortDirection: 'asc' | 'desc' }
  page?: number
  limit?: number
  collection?: string
  ownerAddress: string
  creatorAddress?: string
  creatorVerified?: boolean
  tokenType?:
    'all' | 'compressedNft' | 'regularNft' | 'nonFungible' | 'fungible'
} & { [key: string]: unknown }

// Android's network client has no timeout, so a stalled RPC request fails
// after this long instead of blocking every account cache read
// The DAS calls through axios use the same bound
export const RPC_REQUEST_TIMEOUT = 1000 * 60 // 60 seconds

const withTimeout =
  (fetchFn: FetchFn): FetchFn =>
  (input, init) => {
    const controller = new AbortController()
    let timer: ReturnType<typeof setTimeout> | undefined
    const timeout = new Promise<never>((_resolve, reject) => {
      timer = setTimeout(() => {
        controller.abort()
        // web3.js drops a rejection that is not an Error, so the request would hang
        reject(
          new Error(`RPC request timed out after ${RPC_REQUEST_TIMEOUT} ms`),
        )
      }, RPC_REQUEST_TIMEOUT)
    })
    const request = fetchFn(input, { ...init, signal: controller.signal })
    return Promise.race([request, timeout]).finally(() => clearTimeout(timer))
  }

export class WrappedConnection extends Connection {
  baseURL: string

  constructor(
    endpoint: string,
    commitmentOrConfig?: Commitment | ConnectionConfig,
  ) {
    const config =
      typeof commitmentOrConfig === 'object'
        ? commitmentOrConfig
        : { commitment: commitmentOrConfig || 'confirmed' }
    super(endpoint, {
      ...config,
      fetch: withTimeout(
        config.fetch ?? ((input, init) => globalThis.fetch(input, init)),
      ),
    })
    /* Hardcoding this rpc url for now as it is the only one that supports
     * Digital Asset RPC API https://github.com/metaplex-foundation/digital-asset-rpc-infrastructure
     * Eventually we want to have a hosted RPC node that supports this API
     */
    this.baseURL = endpoint
  }

  async getHealth(): Promise<any> {
    try {
      const response = await axios.post(
        this.baseURL,
        {
          jsonrpc: '2.0',
          method: 'getHealth',
          id: 'rpd-op-123',
        },
        { timeout: RPC_REQUEST_TIMEOUT },
      )
      return { result: response.data.result, error: response.data.error }
    } catch (error) {
      logger.error(error)
    }
  }

  async searchAssets(
    url: string,
    {
      creatorVerified = true,
      sortBy = { sortBy: 'created', sortDirection: 'asc' },
      page = 1,
      limit = 1000,
      collection,
      tokenType,
      ...rest
    }: SearchAssetsOpts,
  ): Promise<CompressedNFT[]> {
    const params = {
      page,
      limit,
      sortBy:
        tokenType && ['all', 'fungible'].includes(tokenType) ? null : sortBy,
      creatorVerified:
        tokenType && ['all', 'fungible'].includes(tokenType)
          ? null
          : creatorVerified,
      tokenType,
      ...(collection ? { grouping: ['collection', collection] } : {}),
      ...rest,
    }

    try {
      const response = await axios.post(
        this.baseURL,
        {
          jsonrpc: '2.0',
          method: 'searchAssets',
          id: 'get-assets-op-1',
          params,
          headers: {
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
            Expires: '0',
          },
        },
        { timeout: RPC_REQUEST_TIMEOUT },
      )

      return response.data.result?.items
    } catch (error) {
      logger.error(error)
      throw error
    }
  }

  async getAsset<T>(assetId: string): Promise<T> {
    try {
      const response = await axios.post(
        this.baseURL,
        {
          jsonrpc: '2.0',
          method: 'getAsset',
          id: 'rpd-op-123',
          params: { id: assetId },
        },
        { timeout: RPC_REQUEST_TIMEOUT },
      )
      return response.data
    } catch (error) {
      logger.error(error)
      throw error
    }
  }

  async getAssetsByOwner<T>(
    assetId: string,
    sortBy: any,
    limit: number,
    page = 1,
    before?: string,
    after?: string,
    options?: {
      showFungible: boolean
    },
  ): Promise<T> {
    try {
      const response = await axios.post(
        this.baseURL,
        {
          jsonrpc: '2.0',
          method: 'getAssetsByOwner',
          id: 'rpd-op-123',
          params: [assetId, sortBy, limit, page, before, after, options],
        },
        { timeout: RPC_REQUEST_TIMEOUT },
      )

      return response.data.result
    } catch (error) {
      logger.error(error)
      throw error
    }
  }

  async getAssetProof(assetId: any): Promise<any> {
    try {
      const response = await axios.post(
        this.baseURL,
        {
          jsonrpc: '2.0',
          method: 'getAssetProof',
          id: 'rpd-op-123',
          params: { id: assetId },
        },
        { timeout: RPC_REQUEST_TIMEOUT },
      )
      return response.data.result
    } catch (error) {
      console.error(error)
    }
  }
}

export interface Asset {
  jsonrpc: string
  result: AssetResult
  id: string
}

export interface AssetResult {
  interface: string
  id: string
  content: Content
  authorities: Authority[]
  compression: Compression
  grouping: Grouping[]
  royalty: Royalty
  creators: any[]
  ownership: Ownership
  supply: Supply
  mutable: boolean
}

export interface Content {
  $schema: string
  json_uri: string
  files: File[]
  metadata: Metadata
}

export interface File {
  uri: string
  mime: string
}

export interface Metadata {
  attributes: Attribute[]
  description: string
  name: string
  symbol: string
}

export interface Attribute {
  value: any
  trait_type: string
}

export interface Authority {
  address: string
  scopes: string[]
}

export interface Compression {
  eligible: boolean
  compressed: boolean
  data_hash: string
  creator_hash: string
  asset_hash: string
  tree: string
  seq: number
  leaf_id: number
}

export interface Grouping {
  group_key: string
  group_value: string
}

export interface Royalty {
  royalty_model: string
  target: any
  percent: number
  basis_points: number
  primary_sale_happened: boolean
  locked: boolean
}

export interface Ownership {
  frozen: boolean
  delegated: boolean
  delegate: any
  ownership_model: string
  owner: string
}

export interface Supply {
  print_max_supply: number
  print_current_supply: number
  edition_nonce: number
}
