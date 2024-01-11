import Box from '@components/Box'
import Text from '@components/Text'
import TokenIcon from '@components/TokenIcon'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import { PublicKey } from '@solana/web3.js'
import { useCreateOpacity } from '@theme/themeHooks'
import React, { memo, useCallback } from 'react'
import { Pressable, ViewStyle } from 'react-native'
import { Color } from '@theme/theme'
import CarotDown from '../assets/images/carotDownFull.svg'

export const TokenPill = memo(
  ({
    mint,
    hasCarot = false,
    isActive = false,
    isDisabled = false,
    onPress,
    activeColor = 'black',
    inactiveColor = 'secondary',
    ...rest
  }: {
    mint: PublicKey
    hasCarot?: boolean
    isActive?: boolean
    isDisabled?: boolean
    onPress: () => void
    style?: ViewStyle | undefined
    activeColor?: Color
    inactiveColor?: Color
  }) => {
    const { symbol, json } = useMetaplexMetadata(mint)
    const { backgroundStyle: generateBackgroundStyle } = useCreateOpacity()

    const getBackgroundColorStylePill = useCallback(
      ({
        pressed,
        active,
        disabled,
      }: {
        pressed: boolean
        active: boolean
        disabled: boolean
      }) => {
        if (disabled) {
          return generateBackgroundStyle('surfaceSecondary', 0.5)
        }
        if (pressed) {
          return generateBackgroundStyle(activeColor || 'surfaceSecondary', 1.0)
        }
        if (active) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return generateBackgroundStyle(activeColor as any, 1.0)
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return generateBackgroundStyle(inactiveColor as any, 1.0)
      },
      [generateBackgroundStyle, inactiveColor, activeColor],
    )

    return (
      <Box
        flexDirection="row"
        flex={1}
        justifyContent="center"
        opacity={isDisabled ? 0.5 : 1}
      >
        <Pressable onPress={onPress} disabled={isDisabled}>
          {({ pressed }) => (
            <Box
              style={[
                getBackgroundColorStylePill({
                  active: isActive,
                  pressed,
                  disabled: isDisabled,
                }),
                rest.style ? rest.style : {},
              ]}
              height={45}
              borderRadius="round"
              flexDirection="row"
              alignItems="center"
              shadowColor="black"
              shadowOpacity={0.2}
              shadowOffset={{ width: 0, height: 3 }}
              shadowRadius={3}
              padding="s"
              paddingRight="m"
            >
              <Box
                marginEnd="xs"
                width={32}
                height={32}
                backgroundColor="black"
                justifyContent="center"
                alignItems="center"
                borderRadius="round"
              >
                <TokenIcon img={json?.image} size={24} />
              </Box>
              <Text
                variant="subtitle4"
                color="white"
                flexGrow={1}
                textAlign="center"
              >
                {symbol}
              </Text>
              {hasCarot && (
                <Box marginStart="xs" justifyContent="center">
                  <CarotDown color="white" width={9} />
                </Box>
              )}
            </Box>
          )}
        </Pressable>
      </Box>
    )
  },
)

export default TokenPill
