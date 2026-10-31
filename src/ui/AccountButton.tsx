import { ChevronDown } from 'lucide-react-native'
import React from 'react'
import { Keyboard, View } from 'react-native'
import { withUniwind } from 'uniwind'
import { AccountIcon } from './AccountIcon'
import { PressableScale } from './PressableScale'
import { Text } from './Text'
import { twMerge } from './twMerge'

const ChevronDownIcon = withUniwind(ChevronDown)

const BUBBLE_ARROW_STYLE = { transform: [{ rotate: '45deg' }] }

export type AccountButtonProps = {
  onPress?: (address?: string) => void
  address?: string
  title?: string
  subtitle?: string
  showBubbleArrow?: boolean
  showChevron?: boolean
  accountIconSize?: number
  // Fills the pill and its bubble arrow.
  backgroundClassName?: string
  className?: string
}

// A pill that shows an account and opens the account picker. A press
// dismisses the keyboard and reports the address.
export const AccountButton = ({
  onPress,
  address,
  title,
  subtitle,
  showBubbleArrow,
  showChevron = true,
  accountIconSize = 28,
  backgroundClassName,
  className,
}: AccountButtonProps) => (
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
        'flex-row items-center rounded-[20px] px-6 py-4',
        backgroundClassName,
      )}
    >
      <AccountIcon size={accountIconSize} address={address} />
      <View className="flex-1">
        {subtitle ? (
          <Text size="xs" className="ml-3 text-muted-foreground">
            {subtitle}
          </Text>
        ) : null}
        <Text size="lg" className="ml-3 mr-1 font-medium">
          {title}
        </Text>
      </View>
      {showChevron ? (
        <ChevronDownIcon size={16} colorClassName="accent-muted-foreground" />
      ) : null}
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
