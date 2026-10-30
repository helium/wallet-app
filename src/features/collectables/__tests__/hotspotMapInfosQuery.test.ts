import { AnchorProvider } from '@anchor-lang/core'
import { CompressedNFT } from '../../../types/solana'
import { hotspotMapInfosQuery } from '../hotspotMapInfosQuery'

jest.mock('@helium/helium-entity-manager-sdk', () => ({
  decodeEntityKey: jest.fn(),
  init: jest.fn(),
  iotInfoKey: jest.fn(),
  keyToAssetForAsset: jest.fn(),
  mobileInfoKey: jest.fn(),
}))
jest.mock('../../../utils/constants', () => ({}))
jest.mock('../../../utils/solanaUtils', () => ({
  getCachedIotInfos: jest.fn(),
  getCachedKeyToAssets: jest.fn(),
  getCachedMobileInfos: jest.fn(),
  toAsset: jest.fn(),
}))

const provider = (rpcEndpoint: string) =>
  ({ connection: { rpcEndpoint } } as unknown as AnchorProvider)
const hotspot = (id: string) => ({ id } as CompressedNFT)

const base = {
  anchorProvider: provider('https://rpc-a'),
  networkType: 'IOT' as const,
  hotspots: [hotspot('hotspot-1'), hotspot('hotspot-2')],
  enabled: true,
}

describe('hotspotMapInfosQuery', () => {
  it('gives the same inputs the same key', () => {
    expect(
      hotspotMapInfosQuery({
        ...base,
        hotspots: [hotspot('hotspot-1'), hotspot('hotspot-2')],
      }).queryKey,
    ).toEqual(hotspotMapInfosQuery(base).queryKey)
  })

  it.each([
    ['rpc endpoint', { anchorProvider: provider('https://rpc-b') }],
    ['network', { networkType: 'MOBILE' as const }],
    ['hotspot list', { hotspots: [hotspot('hotspot-1')] }],
  ])('keys a changed %s apart', (_, change) => {
    expect(hotspotMapInfosQuery({ ...base, ...change }).queryKey).not.toEqual(
      hotspotMapInfosQuery(base).queryKey,
    )
  })

  it('waits for every hotspot page and a provider', () => {
    expect(hotspotMapInfosQuery(base).enabled).toBe(true)
    expect(hotspotMapInfosQuery({ ...base, enabled: false }).enabled).toBe(
      false,
    )
    expect(
      hotspotMapInfosQuery({ ...base, anchorProvider: undefined }).enabled,
    ).toBe(false)
  })

  it('shows a failed read at once', () => {
    expect(hotspotMapInfosQuery(base).retry).toBe(false)
  })
})
