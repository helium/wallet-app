import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import type { PublicKey } from '@solana/web3.js'
import { ChevronDown } from 'lucide-react-native'
import React from 'react'
import { View } from 'react-native'
import { withUniwind } from 'uniwind'
import { PressableScale } from './PressableScale'
import { Text } from './Text'
import { TokenIcon } from './TokenIcon'

const ChevronDownIcon = withUniwind(ChevronDown)

export type TokenPillProps = {
  mint: PublicKey
  hasCarot?: boolean
  onPress: () => void
}

// A token's icon and symbol in a pill; a press opens the token selector.
export const TokenPill = ({
  mint,
  hasCarot = false,
  onPress,
}: TokenPillProps) => {
  const { symbol, json } = useMetaplexMetadata(mint)

  return (
    <View className="flex-1 flex-row justify-center">
      <PressableScale
        onPress={onPress}
        className="h-[45px] flex-row items-center rounded-full border border-border bg-background p-2 pr-4"
      >
        <View className="me-1 size-8 items-center justify-center rounded-full bg-primary">
          <TokenIcon img={json?.image} size={24} />
        </View>
        <Text className="grow text-center font-medium">{symbol}</Text>
        {hasCarot && (
          <View className="ms-1 justify-center">
            <ChevronDownIcon size={16} colorClassName="accent-foreground" />
          </View>
        )}
      </PressableScale>
    </View>
  )
}
