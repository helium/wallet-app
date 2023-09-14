import { ReAnimatedBlurBox } from '@components/AnimatedBox'
import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import CircleLoader from '@components/CircleLoader'
import CloseButton from '@components/CloseButton'
import { FadeInFast } from '@components/FadeInOut'
import SafeAreaBox from '@components/SafeAreaBox'
import Text from '@components/Text'
import TokenPill from '@components/TokenPill'
import { HNT_MINT, IOT_MINT, MOBILE_MINT } from '@helium/spl-utils'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import { PublicKey } from '@solana/web3.js'
import { useModal } from '@storage/ModalsProvider'
import { useVisibleTokens } from '@storage/TokensProvider'
import { useSpacing } from '@theme/themeHooks'
import React, { FC, memo, useCallback, useMemo, useState } from 'react'
import { Edge } from 'react-native-safe-area-context'

const InsufficientSOLConversionModal: FC = () => {
  const { hideModal } = useModal()
  const spacing = useSpacing()
  const edges = useMemo(() => ['top', 'bottom'] as Edge[], [])
  const [inputMint, setInputMint] = useState<PublicKey | undefined>(HNT_MINT)
  const { symbol } = useMetaplexMetadata(inputMint)
  const [swapping, setSwapping] = useState(false)
  const { visibleTokens } = useVisibleTokens()

  const validInputMints = useMemo(
    () =>
      [HNT_MINT, MOBILE_MINT, IOT_MINT].filter((key) =>
        visibleTokens.has(key.toBase58()),
      ),
    [visibleTokens],
  )

  const onMintSelect = useCallback(
    (mint: PublicKey) => () => setInputMint(mint),
    [],
  )

  const handleSwapTokens = useCallback(() => {
    setSwapping(true)
  }, [])

  return (
    <ReAnimatedBlurBox
      visible
      entering={FadeInFast}
      position="absolute"
      height="100%"
      width="100%"
      paddingBottom="xxxl"
    >
      <SafeAreaBox edges={edges} flex={1}>
        <Box
          flexDirection="row"
          alignItems="center"
          justifyContent="center"
          paddingTop="s"
          paddingHorizontal="m"
        >
          <CloseButton onPress={hideModal} />
          <Text variant="h4" color="white" flex={1} textAlign="center">
            Insufficient SOL
          </Text>
          <Box width={16 + spacing.m} height={16} />
        </Box>
        <Box flex={1} paddingHorizontal="m" marginTop="l">
          <Text
            variant="body1Medium"
            color="white"
            opacity={0.6}
            textAlign="center"
          >
            You currently dont have enough SOL to perform this action. Please
            burn one of the following tokens to receive more SOL in order to
            continue.
          </Text>
          <Box
            flexDirection="row"
            justifyContent="space-between"
            marginTop="xxl"
          >
            {validInputMints.map((mint) => (
              <TokenPill
                key={mint.toBase58()}
                mint={mint}
                isActive={inputMint?.equals(mint)}
                onPress={onMintSelect(mint)}
              />
            ))}
          </Box>
          <Box flex={1} marginTop="xxl" alignItems="center">
            <Box justifyContent="center" alignItems="center">
              <Text
                variant="body3"
                color="white"
                opacity={0.6}
                marginBottom="xs"
              >
                You Burn
              </Text>
              <Box flexDirection="row">
                <Text marginEnd="s" variant="h4">
                  0.20015
                </Text>
                <Text variant="h4" color="white" opacity={0.6}>
                  {symbol}
                </Text>
              </Box>
            </Box>
            <Box marginTop="xxl" justifyContent="center" alignItems="center">
              <Text
                variant="body3"
                color="white"
                opacity={0.6}
                marginBottom="xs"
              >
                You Receive
              </Text>
              <Box flexDirection="row">
                <Text marginEnd="s" variant="h4">
                  0.02
                </Text>
                <Text variant="h4" color="white" opacity={0.6}>
                  SOL
                </Text>
              </Box>
            </Box>
          </Box>
        </Box>
        <Box
          flexDirection="column"
          marginBottom="xl"
          marginTop="m"
          marginHorizontal="xl"
        >
          <ButtonPressable
            height={65}
            flexGrow={1}
            borderRadius="round"
            backgroundColor="white"
            backgroundColorOpacityPressed={0.7}
            backgroundColorDisabled="secondaryBackground"
            titleColorDisabled="secondaryText"
            titleColor="black"
            disabled={!inputMint}
            titleColorPressedOpacity={0.3}
            title={swapping ? '' : 'Swap Tokens'}
            onPress={handleSwapTokens}
            TrailingComponent={
              swapping ? (
                <CircleLoader loaderSize={20} color="black" />
              ) : undefined
            }
          />
        </Box>
      </SafeAreaBox>
    </ReAnimatedBlurBox>
  )
}

export default memo(() => {
  const { modalType } = useModal()

  if (modalType !== 'InsufficientSOLConversion') return null
  return <InsufficientSOLConversionModal />
})
