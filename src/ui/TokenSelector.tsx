import {
  BottomSheetFlatList,
  type BottomSheetModal,
  BottomSheetModalProvider,
} from '@gorhom/bottom-sheet'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import type { PublicKey } from '@solana/web3.js'
import React, {
  type ReactNode,
  useCallback,
  useImperativeHandle,
  useRef,
} from 'react'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSheetMargins } from './ContentColumn'
import { LIST_ITEM_HEIGHT, ListItem } from './ListItem'
import { Sheet } from './Sheet'
import { TokenIcon } from './TokenIcon'
import { twMerge } from './twMerge'

export type TokenListItem = {
  mint: PublicKey
  selected: boolean
}

const TokenRow = ({
  mint,
  onPress,
  selected,
}: {
  mint: PublicKey
  onPress: (mint: PublicKey) => void
  selected: boolean
}) => {
  const { symbol, json } = useMetaplexMetadata(mint)
  return (
    <ListItem
      title={symbol || ''}
      Icon={json?.image ? <TokenIcon size={30} img={json.image} /> : undefined}
      onPress={() => onPress(mint)}
      selected={selected}
      className="ps-6"
      hasDivider
    />
  )
}

const keyExtractor = (item: TokenListItem) => item.mint.toBase58()

export type TokenSelectorRef = {
  showTokens: () => void
}

export type TokenSelectorProps = {
  ref?: React.Ref<TokenSelectorRef>
  children: ReactNode
  onTokenSelected: (mint: PublicKey) => void
  tokenData: TokenListItem[]
  className?: string
}

// A token picker sheet. The sheet fits every row. Picking a token closes the
// sheet and reports the mint.
export const TokenSelector = ({
  ref,
  children,
  onTokenSelected,
  tokenData,
  className,
}: TokenSelectorProps) => {
  const { bottom } = useSafeAreaInsets()
  const sheetRef = useRef<BottomSheetModal>(null)
  const sheetMargins = useSheetMargins()

  useImperativeHandle(ref, () => ({
    showTokens: () => sheetRef.current?.present(),
  }))

  const handleTokenPress = useCallback(
    (mint: PublicKey) => {
      sheetRef.current?.dismiss()
      onTokenSelected(mint)
    },
    [onTokenSelected],
  )

  const renderItem = useCallback(
    ({ item }: { item: TokenListItem }) => (
      <TokenRow
        selected={item.selected}
        onPress={handleTokenPress}
        mint={item.mint}
      />
    ),
    [handleTokenPress],
  )

  return (
    <BottomSheetModalProvider>
      <View className={twMerge('flex-1', className)}>
        <Sheet
          ref={sheetRef}
          style={sheetMargins}
          index={0}
          snapPoints={[(tokenData.length + 2) * LIST_ITEM_HEIGHT + bottom]}
        >
          <BottomSheetFlatList
            contentInsetAdjustmentBehavior="automatic"
            data={tokenData}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
          />
        </Sheet>
        {children}
      </View>
    </BottomSheetModalProvider>
  )
}
