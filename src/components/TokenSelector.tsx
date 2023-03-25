import React, {
  forwardRef,
  memo,
  ReactNode,
  Ref,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react'
import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetModal,
  BottomSheetModalProvider,
} from '@gorhom/bottom-sheet'
import { BoxProps } from '@shopify/restyle'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ticker } from '@helium/currency'
import { useColors, useOpacity } from '@theme/themeHooks'
import { Theme } from '@theme/theme'
import useBackHandler from '@hooks/useBackHandler'
import Box from './Box'
import ListItem, { LIST_ITEM_HEIGHT } from './ListItem'

export type TokenListItem = {
  label: string
  icon: ReactNode
  value: Ticker
  selected: boolean
}

export type TokenSelectorRef = {
  showTokens: () => void
}
type Props = {
  children: ReactNode
  onTokenSelected: (type: Ticker) => void
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
      (token: string) => () => {
        bottomSheetModalRef.current?.dismiss()
        onTokenSelected(token as Ticker)
      },
      [onTokenSelected],
    )

    const keyExtractor = useCallback((item: TokenListItem) => {
      return item.value
    }, [])

    const renderFlatlistItem = useCallback(
      ({ item }: { item: TokenListItem; index: number }) => {
        return (
          <ListItem
            title={item.label}
            Icon={item.icon}
            onPress={handleTokenPress(item.value)}
            selected={item.selected}
            paddingStart="l"
            hasDivider
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
