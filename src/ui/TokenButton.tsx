import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import type { PublicKey } from '@solana/web3.js'
import { ChevronDown } from 'lucide-react-native'
import React from 'react'
import { Keyboard, View } from 'react-native'
import { withUniwind } from 'uniwind'
import { PressableScale } from './PressableScale'
import { Text } from './Text'
import { TokenIcon } from './TokenIcon'
import { twMerge } from './twMerge'

const ChevronDownIcon = withUniwind(ChevronDown)

const BUBBLE_ARROW_STYLE = { transform: [{ rotate: '45deg' }] }

const TokenImage = ({ mint }: { mint?: PublicKey }) => {
  const { json } = useMetaplexMetadata(mint)
  return <TokenIcon img={json?.image} size={41} />
}

export type TokenButtonProps = {
  onPress?: (address?: string) => void
  address?: string
  title?: string
  subtitle?: string
  showBubbleArrow?: boolean
  mint?: PublicKey
  // Fills the pill and its bubble arrow.
  backgroundClassName?: string
  className?: string
}

// A pill that shows a token and opens the token picker. A press dismisses
// the keyboard and reports the address.
export const TokenButton = ({
  onPress,
  address,
  title,
  subtitle,
  showBubbleArrow,
  mint,
  backgroundClassName,
  className,
}: TokenButtonProps) => (
  <PressableScale
    feedback="opacity"
    hitSlop={24}
    className={twMerge('items-center', className)}
    onPress={() => {
      Keyboard.dismiss()
      onPress?.(address)
    }}
    disabled={!onPress}
  >
    <View
      className={twMerge(
        'flex-row items-center rounded-2xl px-4 py-[15px]',
        backgroundClassName,
      )}
    >
      <TokenImage mint={mint} />
      <View className="flex-1">
        <Text size="lg" className="ml-3 mr-1 font-medium">
          {title}
        </Text>
        {subtitle ? (
          <Text size="xs" className="ml-3 text-muted-foreground">
            {subtitle}
          </Text>
        ) : null}
      </View>
      <ChevronDownIcon size={16} colorClassName="accent-muted-foreground" />
    </View>
    {showBubbleArrow ? (
      <View className="h-[18px]">
        <View
          className={twMerge(
            '-m-[9px] size-[18px] self-center',
            backgroundClassName,
          )}
          style={BUBBLE_ARROW_STYLE}
        />
      </View>
    ) : null}
  </PressableScale>
)
