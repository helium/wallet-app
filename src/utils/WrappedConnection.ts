/* eslint-disable @typescript-eslint/no-explicit-any */
import { Commitment, Connection, ConnectionConfig } from '@solana/web3.js'
import axios from 'axios'

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
      console.error(error)
    }
  }

  async getAsset(assetId: any): Promise<any> {
    try {
      const response = await axios.post(this.baseURL, {
        jsonrpc: '2.0',
        method: 'get_asset',
        id: 'rpd-op-123',
        params: [assetId],
      })
      return response.data.result
    } catch (error) {
      console.error(error)
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
        method: 'get_assets_by_owner',
        id: 'rpd-op-123',
        params: [assetId, sortBy, limit, page, before, after],
      })
      return response.data.result
    } catch (error) {
      console.error(error)
    }
  }

  async getAssetProof(assetId: any): Promise<any> {
    try {
      const response = await axios.post(this.baseURL, {
        jsonrpc: '2.0',
        method: 'get_asset_proof',
        id: 'rpd-op-123',
        params: [assetId],
      })
      return response.data.result
    } catch (error) {
      console.error(error)
    }
  }
}
