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
    activeColor = 'primaryBackground',
    inactiveColor = 'bg.tertiary',
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
          return generateBackgroundStyle('bg.tertiary', 0.5)
        }
        if (pressed) {
          return generateBackgroundStyle(activeColor || 'bg.tertiary', 1.0)
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
              borderRadius="full"
              flexDirection="row"
              alignItems="center"
              shadowColor="base.black"
              shadowOpacity={0.2}
              shadowOffset={{ width: 0, height: 3 }}
              shadowRadius={3}
              padding="2"
              paddingRight="4"
            >
              <Box
                marginEnd="xs"
                width={32}
                height={32}
                backgroundColor="base.black"
                justifyContent="center"
                alignItems="center"
                borderRadius="full"
              >
                <TokenIcon img={json?.image} size={24} />
              </Box>
              <Text
                variant="textSmMedium"
                color="primaryText"
                flexGrow={1}
                textAlign="center"
              >
                {symbol}
              </Text>
              {hasCarot && (
                <Box marginStart="xs" justifyContent="center">
                  <CarotDown color="primaryText" width={9} />
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
