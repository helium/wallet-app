import TokenIcon from '@components/TokenIcon'
import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetModal,
  BottomSheetModalProvider,
} from '@gorhom/bottom-sheet'
import useBackHandler from '@hooks/useBackHandler'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import { BoxProps } from '@shopify/restyle'
import { PublicKey } from '@solana/web3.js'
import { Theme } from '@theme/theme'
import { useColors, useOpacity } from '@theme/themeHooks'
import React, {
  ReactNode,
  Ref,
  forwardRef,
  memo,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Box from './Box'
import ListItem, { LIST_ITEM_HEIGHT } from './ListItem'

export type TokenListItem = {
  mint: PublicKey
  selected: boolean
}

const ProvidedListItem = ({
  mint,
  onPress,
  selected,
}: {
  mint: PublicKey
  onPress: () => void
  selected: boolean
}) => {
  const { symbol, json } = useMetaplexMetadata(mint)
  return (
    <ListItem
      title={symbol || ''}
      Icon={json?.image ? <TokenIcon size={30} img={json.image} /> : undefined}
      onPress={onPress}
      selected={selected}
      paddingStart="l"
      hasDivider
    />
  )
}

export type TokenSelectorRef = {
  showTokens: () => void
}
type Props = {
  children: ReactNode
  onTokenSelected: (mint: PublicKey) => void
  tokenData: TokenListItem[]
} & BoxProps<Theme>
const TokenSelector = forwardRef(
  (
    { children, onTokenSelected, tokenData, ...boxProps }: Props,
    ref: Ref<TokenSelectorRef>,
  ) => {
    useImperativeHandle(ref, () => ({ showTokens }))

    const { bottom } = useSafeAreaInsets()
    const bottomSheetModalRef = useRef<BottomSheetModal>(null)
    const { backgroundStyle } = useOpacity('surfaceSecondary', 1)
    const { handleDismiss, setIsShowing } = useBackHandler(bottomSheetModalRef)
    const { secondaryText } = useColors()

    const showTokens = useCallback(() => {
      bottomSheetModalRef.current?.present()
      setIsShowing(true)
    }, [setIsShowing])

    const renderBackdrop = useCallback(
      (props) => (
        <BottomSheetBackdrop
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          {...props}
        />
      ),
      [],
    )

    const handleTokenPress = useCallback(
      (token: PublicKey) => {
        bottomSheetModalRef.current?.dismiss()
        onTokenSelected(token)
      },
      [onTokenSelected],
    )

    const keyExtractor = useCallback((item: TokenListItem) => {
      return item.mint.toBase58()
    }, [])

    const renderFlatlistItem = useCallback(
      ({ item }: { item: TokenListItem; index: number }) => {
        return (
          <ProvidedListItem
            key={item.mint.toBase58()}
            selected={item.selected}
            onPress={() => handleTokenPress(item.mint)}
            mint={item.mint}
          />
        )
      },
      [handleTokenPress],
    )

    const snapPoints = useMemo(
      () => [(tokenData.length + 2) * LIST_ITEM_HEIGHT + bottom],
      [bottom, tokenData.length],
    )

    const handleIndicatorStyle = useMemo(() => {
      return {
        backgroundColor: secondaryText,
      }
    }, [secondaryText])

    return (
      <BottomSheetModalProvider>
        <Box flex={1} {...boxProps}>
          <BottomSheetModal
            ref={bottomSheetModalRef}
            index={0}
            backgroundStyle={backgroundStyle}
            backdropComponent={renderBackdrop}
            snapPoints={snapPoints}
            onDismiss={handleDismiss}
            handleIndicatorStyle={handleIndicatorStyle}
          >
            <BottomSheetFlatList
              data={tokenData}
              renderItem={renderFlatlistItem}
              keyExtractor={keyExtractor}
            />
          </BottomSheetModal>
          {children}
        </Box>
      </BottomSheetModalProvider>
    )
  },
)

export default memo(TokenSelector)
