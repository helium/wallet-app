import { AnchorProvider } from '@anchor-lang/core'
import {
  decodeEntityKey,
  init,
  iotInfoKey,
  keyToAssetForAsset,
  mobileInfoKey,
} from '@helium/helium-entity-manager-sdk'
import { chunks, truthy } from '@helium/spl-utils'
import { queryOptions } from '@tanstack/react-query'
import { IotHotspotInfoV0 } from '../../hooks/useIotInfo'
import { MobileHotspotInfoV0 } from '../../hooks/useMobileInfo'
import { CompressedNFT } from '../../types/solana'
import { IOT_CONFIG_KEY, MOBILE_CONFIG_KEY } from '../../utils/constants'
import {
  getCachedIotInfos,
  getCachedKeyToAssets,
  getCachedMobileInfos,
  toAsset,
} from '../../utils/solanaUtils'

export type HexInfoBuckets = {
  [key: string]: IotHotspotInfoV0[] | MobileHotspotInfoV0[]
}

// The wallet's hotspot infos for one network, grouped by location hex
export const hotspotMapInfosQuery = ({
  anchorProvider,
  networkType,
  hotspots,
  enabled,
}: {
  anchorProvider?: AnchorProvider
  networkType: 'IOT' | 'MOBILE'
  hotspots: CompressedNFT[]
  enabled: boolean
}) =>
  queryOptions({
    queryKey: [
      'hotspotMapInfos',
      anchorProvider?.connection.rpcEndpoint,
      networkType,
      hotspots.map((h) => h.id),
    ],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const hemProgram = await init(anchorProvider!)

      const infos = (
        await Promise.all(
          chunks(hotspots, 100).map(async (chunk) => {
            const keyToAssetKeys = chunk.map((h) =>
              keyToAssetForAsset(toAsset(h)),
            )

            const ktaAccs = await getCachedKeyToAssets(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              hemProgram as any,
              keyToAssetKeys,
            )

            const entityKeys = ktaAccs
              .map((kta) => {
                return decodeEntityKey(kta.entityKey, kta.keySerialization)
              })
              .filter(truthy)

            const infoKeys = entityKeys.map((ek) => {
              const keys = {
                IOT: iotInfoKey(IOT_CONFIG_KEY, ek)[0],
                MOBILE: mobileInfoKey(MOBILE_CONFIG_KEY, ek)[0],
              }

              return keys[networkType]
            })

            if (networkType === 'IOT') {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              return getCachedIotInfos(hemProgram as any, infoKeys)
            }

            if (networkType === 'MOBILE') {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              return getCachedMobileInfos(hemProgram as any, infoKeys)
            }
          }),
        )
      ).flat()

      return infos
        .filter((info) => info && truthy(info.location))
        .reduce(
          (acc, info) => ({
            ...acc,
            ...(info?.location
              ? {
                  [info.location.toString()]: [
                    ...(acc[info.location.toString()] || []),
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    info as any,
                  ],
                }
              : {}),
          }),
          {} as HexInfoBuckets,
        )
    },
    enabled: enabled && !!anchorProvider,
    // The map shows a failed read at once, as it did before; three retries
    // would hold the loader for about 7 s first
    retry: false,
  })
