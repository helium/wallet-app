import TokenIcon from '@components/TokenIcon'
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetModalProvider,
} from '@gorhom/bottom-sheet'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import { BoxProps, ThemeProvider } from '@shopify/restyle'
import { PublicKey } from '@solana/web3.js'
import { Theme, lightTheme } from '@theme/theme'
import { useSpacing } from '@theme/themeHooks'
import React, {
  Ref,
  forwardRef,
  memo,
  useCallback,
  useImperativeHandle,
  useRef,
} from 'react'
import { Portal } from '@gorhom/portal'
import { useTranslation } from 'react-i18next'
import Box from './Box'
import ListItem from './ListItem'
import HeliumBottomSheet from './HeliumBottomSheet'
import { SafeAreaBox, Text } from '.'

export type TokenListItem = {
  mint: PublicKey
  selected: boolean
}

const ProvidedListItem = ({
  mint,
  onPress,
  selected,
  ...rest
}: {
  mint: PublicKey
  onPress: () => void
  selected: boolean
} & BoxProps<Theme>) => {
  const { symbol, json } = useMetaplexMetadata(mint)
  return (
    <ListItem
      title={symbol || ''}
      Icon={json?.image ? <TokenIcon size={30} img={json.image} /> : undefined}
      onPress={onPress}
      selected={selected}
      paddingStart="6"
      hasDivider
      {...rest}
    />
  )
}

export type TokenSelectorRef = {
  showTokens: () => void
}
type Props = {
  onTokenSelected: (mint: PublicKey) => void
  tokenData: TokenListItem[]
} & BoxProps<Theme>
const TokenSelector = forwardRef(
  ({ onTokenSelected, tokenData }: Props, ref: Ref<TokenSelectorRef>) => {
    useImperativeHandle(ref, () => ({ showTokens }))

    const spacing = useSpacing()
    const bottomSheetModalRef = useRef<BottomSheet>(null)
    const { t } = useTranslation()

    const showTokens = useCallback(() => {
      bottomSheetModalRef.current?.expand()
    }, [])

    const renderBackdrop = useCallback(
      (props) => (
        <BottomSheetBackdrop
          opacity={1}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          {...props}
        >
          <SafeAreaBox backgroundColor="primaryText" flex={1}>
            <Text
              marginTop="xl"
              variant="displaySmSemibold"
              color="primaryBackground"
              textAlign="center"
            >
              {t('tokenSelector.title')}
            </Text>
          </SafeAreaBox>
        </BottomSheetBackdrop>
      ),
      [],
    )

    const handleTokenPress = useCallback(
      (token: PublicKey) => {
        bottomSheetModalRef.current?.close()
        onTokenSelected(token)
      },
      [onTokenSelected],
    )

    const keyExtractor = useCallback((item: TokenListItem) => {
      return item.mint.toBase58()
    }, [])

    const renderFlatlistItem = useCallback(
      ({ item, index }: { item: TokenListItem; index: number }) => {
        const borderTopStartRadius = index === 0 ? '2xl' : 'none'
        const borderTopEndRadius = index === 0 ? '2xl' : 'none'
        const borderBottomStartRadius =
          index === tokenData.length - 1 ? '2xl' : 'none'
        const borderBottomEndRadius =
          index === tokenData.length - 1 ? '2xl' : 'none'

        return (
          <ProvidedListItem
            key={item.mint.toBase58()}
            selected={item.selected}
            onPress={() => handleTokenPress(item.mint)}
            mint={item.mint}
            borderTopStartRadius={borderTopStartRadius}
            borderTopEndRadius={borderTopEndRadius}
            borderBottomStartRadius={borderBottomStartRadius}
            borderBottomEndRadius={borderBottomEndRadius}
          />
        )
      },
      [handleTokenPress],
    )

    return (
      <Portal>
        <ThemeProvider theme={lightTheme}>
          <BottomSheetModalProvider>
            <HeliumBottomSheet
              ref={bottomSheetModalRef}
              index={-1}
              backdropComponent={renderBackdrop}
            >
              <Box flex={1}>
                <BottomSheetFlatList
                  data={tokenData}
                  renderItem={renderFlatlistItem}
                  keyExtractor={keyExtractor}
                  contentContainerStyle={{
                    padding: spacing[4],
                    marginTop: spacing['6xl'],
                  }}
                />
              </Box>
            </HeliumBottomSheet>
          </BottomSheetModalProvider>
        </ThemeProvider>
      </Portal>
    )
  },
)

export default memo(TokenSelector)
