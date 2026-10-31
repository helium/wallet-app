import TokenPill from '@components/TokenPill'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import { PublicKey } from '@solana/web3.js'
import { Card } from '@ui/Card'
import { PressableScale } from '@ui/PressableScale'
import { Text } from '@ui/Text'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { GestureResponderEvent, View } from 'react-native'

export type SwapItemProps = {
  isPaying: boolean
  onCurrencySelect: () => void
  mintSelected: PublicKey
  amount: number
  loading?: boolean
  onPress?: ((event: GestureResponderEvent) => void) | null | undefined
  disabled?: boolean
  testID?: string
  className?: string
}

const SwapItem = ({
  isPaying,
  onCurrencySelect,
  mintSelected,
  amount,
  loading = false,
  onPress,
  disabled,
  testID,
  className,
}: SwapItemProps) => {
  const { t } = useTranslation()
  const { symbol } = useMetaplexMetadata(mintSelected)

  return (
    <PressableScale
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      feedback="opacity"
      className={className}
    >
      <Card
        variant="panel"
        className="h-[120px] items-center justify-center rounded-[20px]"
      >
        <View className="absolute -top-[22.5px]">
          <TokenPill mint={mintSelected} hasCarot onPress={onCurrencySelect} />
        </View>
        <Text size="xs" className="mb-1 text-muted-foreground">
          {isPaying ? t('swapsScreen.youPay') : t('swapsScreen.youReceive')}
        </Text>
        <View className="flex-row">
          <Text size="xl" className="me-2">
            {!loading ? amount.toString() : t('generic.loading')}
          </Text>
          <Text size="xl" className="text-muted-foreground">{`${symbol}`}</Text>
        </View>
        {isPaying && (
          <View className="absolute bottom-0 -m-[9px] size-[18px] rotate-45 self-center bg-secondary" />
        )}
      </Card>
    </PressableScale>
  )
}

export default SwapItem
