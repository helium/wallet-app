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
import { useColors, useOpacity } from '@theme/themeHooks'
import { Theme } from '@theme/theme'
import useBackHandler from '@hooks/useBackHandler'
import Box from './Box'
import ListItem, { LIST_ITEM_HEIGHT } from './ListItem'

export type TokenListItem = {
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
  tokenData?: TokenListItem[]
} & BoxProps<Theme>
const TokenSelector = forwardRef(
  (
    { children, onTokenSelected, tokenData, ...boxProps }: Props,
    ref: Ref<TokenSelectorRef>,
  ) => {
    useImperativeHandle(ref, () => ({ showTokens }))

    const { bottom } = useSafeAreaInsets()
    const [currentToken, setCurrentToken] = useState<string>(
      tokenData?.length ? tokenData[0].value : 'HNT',
    )
    const bottomSheetModalRef = useRef<BottomSheetModal>(null)
    const { backgroundStyle } = useOpacity('surfaceSecondary', 1)
    const { handleDismiss, setIsShowing } = useBackHandler(bottomSheetModalRef)
    const { white, blueBright500, secondaryText } = useColors()

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
            paddingStart="l"
            hasDivider
          />
        )
      },
      [currentToken, handleTokenPress],
    )

    const data = useMemo(
      (): TokenListItem[] => [
        {
          label: 'HNT',
          icon: <TokenHNT width={30} height={30} color={white} />,
          value: 'HNT',
        },
        {
          label: 'MOBILE',
          icon: <TokenMOBILE width={30} height={30} color={blueBright500} />,
          value: 'MOBILE',
        },
      ],

      [blueBright500, white],
    )

    const snapPoints = useMemo(
      () => [(data.length + 2) * LIST_ITEM_HEIGHT + bottom],
      [bottom, data.length],
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
              data={tokenData || data}
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
