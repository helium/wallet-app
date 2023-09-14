import Box from '@components/Box'
import Text from '@components/Text'
import TokenIcon from '@components/TokenIcon'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import { PublicKey } from '@solana/web3.js'
import { useCreateOpacity } from '@theme/themeHooks'
import React, { memo, useCallback } from 'react'
import { Pressable } from 'react-native'
import CarotDown from '../assets/images/carotDownFull.svg'

export const TokenPill = memo(
  ({
    mint,
    hasCarot = false,
    isActive = false,
    onPress,
  }: {
    mint: PublicKey
    hasCarot?: boolean
    isActive?: boolean
    onPress: () => void
  }) => {
    const { symbol, json } = useMetaplexMetadata(mint)
    const { backgroundStyle: generateBackgroundStyle } = useCreateOpacity()

    const getBackgroundColorStylePill = useCallback(
      ({ pressed, active }: { pressed: boolean; active: boolean }) => {
        if (pressed) {
          return generateBackgroundStyle('surfaceSecondary', 1.0)
        }
        if (active) {
          return generateBackgroundStyle('secondaryBackground', 1.0)
        }
        return generateBackgroundStyle('secondary', 1.0)
      },
      [generateBackgroundStyle],
    )

    return (
      <Box flexDirection="row">
        <Pressable onPress={onPress}>
          {({ pressed }) => (
            <Box
              style={getBackgroundColorStylePill({ active: isActive, pressed })}
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
