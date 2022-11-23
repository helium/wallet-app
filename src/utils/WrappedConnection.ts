import { AnchorProvider } from '@project-serum/anchor'
import NodeWallet from '@project-serum/anchor/dist/cjs/nodewallet'
import { Connection, Keypair } from '@solana/web3.js'
import axios from 'axios'

export class WrappedConnection extends Connection {
  axiosInstance: any

  provider: AnchorProvider

  payer: Keypair

  constructor(payer: Keypair, connectionString: string) {
    super(connectionString, 'confirmed')
    /* Hardcoding this rpc url for now as it is the only one that supports
     * Digital Asset RPC API https://github.com/metaplex-foundation/digital-asset-rpc-infrastructure
     * Eventually we want to have a hosted RPC node that supports this API
     */
    this.axiosInstance = axios.create({
      baseURL: 'https://mplx-devnet.genesysgo.net/' ?? connectionString,
    })
    this.provider = new AnchorProvider(
      new Connection(connectionString),
      new NodeWallet(payer),
      {
        commitment: super.commitment,
        skipPreflight: true,
      },
    )
    this.payer = payer
  }

  async getAsset(assetId: any): Promise<any> {
    try {
      const response = await this.axiosInstance.post('get_asset', {
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

  async getAssetProof(assetId: any): Promise<any> {
    try {
      const response = await this.axiosInstance.post('get_asset_proof', {
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

  async getAssetsByOwner(
    assetId: string,
    sortBy: any,
    limit: number,
    page: number,
    before: string,
    after: string,
  ): Promise<any> {
    try {
      const response = await this.axiosInstance.post('get_assets_by_owner', {
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
}
