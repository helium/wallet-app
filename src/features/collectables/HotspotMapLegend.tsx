import HexArt from '@assets/images/hex.svg'
import { Text } from '@ui/Text'
import React from 'react'
import { View } from 'react-native'
import { withUniwind } from 'uniwind'

const Hex = withUniwind(HexArt)

export const HotspotMapLegend = ({
  network,
}: {
  network: 'IOT' | 'MOBILE'
}) => {
  return (
    <View className="flex-col items-center justify-center pb-4 pt-3">
      <View className="flex-row flex-wrap gap-1.5 px-3">
        <View className="flex-row items-center justify-center rounded-full bg-secondary py-1.5 pl-2 pr-3">
          <Hex
            width={18}
            height={18}
            colorClassName={
              network === 'IOT' ? 'accent-success-500' : 'accent-blue-dark-500'
            }
          />
          <Text className="ml-1 text-foreground">{network} Hotspot</Text>
        </View>
        {network === 'MOBILE' && (
          <View className="flex-row items-center justify-center gap-1.5 rounded-full bg-secondary py-1.5 pl-2 pr-3">
            <View className="flex-row items-center justify-center">
              <Hex
                width={18}
                height={18}
                colorClassName="accent-chart-1"
                opacity={0.6}
              />
              <Text className="ml-1.5 text-foreground">Low Boost</Text>
            </View>
            <View className="flex-row items-center justify-center">
              <Hex width={18} height={18} colorClassName="accent-chart-1" />
              <Text className="ml-1.5 text-foreground">High Boost</Text>
            </View>
          </View>
        )}
        <View className="flex-row items-center justify-center gap-2 rounded-full bg-secondary py-1.5 pl-2 pr-3">
          <View className="flex-row items-center justify-center">
            <Hex
              width={18}
              height={18}
              colorClassName="accent-purple-500"
              opacity={0.6}
            />
            <Text className="ml-1 text-foreground">Weak Signal</Text>
          </View>
          <View className="flex-row items-center justify-center">
            <Hex width={18} height={18} colorClassName="accent-purple-500" />
            <Text className="ml-1 text-foreground">Strong Signal</Text>
          </View>
        </View>
      </View>
    </View>
  )
}
