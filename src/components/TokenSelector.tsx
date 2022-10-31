import React, {
  forwardRef,
  memo,
  ReactNode,
  Ref,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetModal,
  BottomSheetModalProvider,
} from '@gorhom/bottom-sheet'
import { BoxProps } from '@shopify/restyle'
import TokenMOBILE from '@assets/images/tokenMOBILE.svg'
import TokenHNT from '@assets/images/tokenHNT.svg'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ticker } from '@helium/currency'
import { useColors, useOpacity, useSpacing } from '../theme/themeHooks'
import { Theme } from '../theme/theme'
import Box from './Box'
import useBackHandler from '../utils/useBackHandler'
import ListItem, { LIST_ITEM_HEIGHT } from './ListItem'

type TokenListItem = {
  label: string
  icon: ReactNode
  value: Ticker
}

export type TokenSelectorRef = {
  showTokens: () => void
}
type Props = {
  children: ReactNode
  onTokenSelected: (type: Ticker) => void
} & BoxProps<Theme>
const TokenSelector = forwardRef(
  (
    { children, onTokenSelected, ...boxProps }: Props,
    ref: Ref<TokenSelectorRef>,
  ) => {
    useImperativeHandle(ref, () => ({ showTokens }))

    const { bottom } = useSafeAreaInsets()
    const [currentToken, setCurrentToken] = useState<string>('HNT')
    const bottomSheetModalRef = useRef<BottomSheetModal>(null)
    const { backgroundStyle } = useOpacity('secondary', 1)
    const { m } = useSpacing()
    const sheetHandleStyle = useMemo(() => ({ padding: m }), [m])
    const { handleDismiss, setIsShowing } = useBackHandler(bottomSheetModalRef)
    const { primary, white, blueBright500 } = useColors()

    const flatListStyle = useMemo(
      () => ({ borderTopColor: primary, borderTopWidth: 1 }),
      [primary],
    )

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
        setCurrentToken(token)
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
            selected={item.value === currentToken}
            marginHorizontal="l"
            hasDivider={false}
          />
        )
      },
      [currentToken, handleTokenPress],
    )

    const data = useMemo(
      (): TokenListItem[] => [
        {
          label: 'HNT',
          icon: <TokenHNT color={white} />,
          value: 'HNT',
        },
        {
          label: 'MOBILE',
          icon: <TokenMOBILE color={blueBright500} />,
          value: 'MOBILE',
        },
      ],

      [blueBright500, white],
    )

    const snapPoints = useMemo(
      () => [data.length * LIST_ITEM_HEIGHT + bottom, '50%'],
      [bottom, data.length],
    )

    return (
      <BottomSheetModalProvider>
        <Box flex={1} {...boxProps}>
          <BottomSheetModal
            ref={bottomSheetModalRef}
            index={0}
            handleComponent={null}
            backgroundStyle={backgroundStyle}
            backdropComponent={renderBackdrop}
            snapPoints={snapPoints}
            handleStyle={sheetHandleStyle}
            onDismiss={handleDismiss}
          >
            <BottomSheetFlatList
              data={data}
              renderItem={renderFlatlistItem}
              keyExtractor={keyExtractor}
              style={flatListStyle}
            />
          </BottomSheetModal>
          {children}
        </Box>
      </BottomSheetModalProvider>
    )
  },
)

export default memo(TokenSelector)
