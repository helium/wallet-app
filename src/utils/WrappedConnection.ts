/* eslint-disable @typescript-eslint/no-explicit-any */
import { Commitment, Connection, ConnectionConfig } from '@solana/web3.js'
import axios from 'axios'
import * as logger from '@utils/logger'

export class WrappedConnection extends Connection {
  baseURL: string

  constructor(
    endpoint: string,
    commitmentOrConfig?: Commitment | ConnectionConfig,
  ) {
    super(endpoint, commitmentOrConfig || 'confirmed')
    /* Hardcoding this rpc url for now as it is the only one that supports
     * Digital Asset RPC API https://github.com/metaplex-foundation/digital-asset-rpc-infrastructure
     * Eventually we want to have a hosted RPC node that supports this API
     */
    this.baseURL = endpoint
  }

  async getHealth(): Promise<any> {
    try {
      const response = await axios.post(this.baseURL, {
        jsonrpc: '2.0',
        method: 'getHealth',
        id: 'rpd-op-123',
      })
      return { result: response.data.result, error: response.data.error }
    } catch (error) {
      logger.error(error)
    }
  }

  async searchAssets(
    ownerAddress: string,
    creatorAddress: string,
    creatorVerified?: boolean,
    sortBy?: { sortBy: 'created'; sortDirection: 'asc' | 'desc' },
    page?: number,
    collection?: string,
  ): Promise<any> {
    try {
      const response = await axios.post(this.baseURL, {
        jsonrpc: '2.0',
        method: 'searchAssets',
        id: 'get-assets-op-1',
        params: {
          page,
          creatorVerified,
          sortBy,
          ownerAddress,
          creatorAddress,
          collection,
        },
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
          Expires: '0',
        },
      })
      return response.data.result
    } catch (error) {
      logger.error(error)
    }
  }

  async getAsset<T>(assetId: any): Promise<T> {
    try {
      const response = await axios.post(this.baseURL, {
        jsonrpc: '2.0',
        method: 'getAsset',
        id: 'rpd-op-123',
        params: { id: assetId },
      })
      return response.data
    } catch (error) {
      logger.error(error)
      throw error
    }
  }

  async getAssetsByOwner(
    assetId: string,
    sortBy: any,
    limit: number,
    page: number,
    before: string,
    after: string,
  ): Promise<any> {
    try {
      const response = await axios.post(this.baseURL, {
        jsonrpc: '2.0',
        method: 'getAssetsByOwner',
        id: 'rpd-op-123',
        params: [assetId, sortBy, limit, page, before, after],
      })
      return response.data.result
    } catch (error) {
      logger.error(error)
    }
  }

  async getAssetProof(assetId: any): Promise<any> {
    try {
      const response = await axios.post(this.baseURL, {
        jsonrpc: '2.0',
        method: 'getAssetProof',
        id: 'rpd-op-123',
        params: { id: assetId },
      })
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
