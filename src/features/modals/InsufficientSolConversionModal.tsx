import { ReAnimatedBlurBox } from '@components/AnimatedBox'
import Box from '@components/Box'
import CloseButton from '@components/CloseButton'
import { FadeInFast } from '@components/FadeInOut'
import SafeAreaBox from '@components/SafeAreaBox'
import Text from '@components/Text'
import TokenPill from '@components/TokenPill'
import { HNT_MINT, IOT_MINT, MOBILE_MINT } from '@helium/spl-utils'
import { PublicKey } from '@solana/web3.js'
import { useModal } from '@storage/ModalsProvider'
import { useVisibleTokens } from '@storage/TokensProvider'
import { useSpacing } from '@theme/themeHooks'
import React, { FC, memo, useCallback, useMemo, useState } from 'react'
import { Edge } from 'react-native-safe-area-context'

const InsufficientSolConversionModal: FC = () => {
  const { hideModal } = useModal()
  const spacing = useSpacing()
  const edges = useMemo(() => ['top', 'bottom'] as Edge[], [])
  const [inputMint, setInputMint] = useState<PublicKey | undefined>()
  const { visibleTokens } = useVisibleTokens()

  const validInputMints = useMemo(
    () =>
      [MOBILE_MINT, HNT_MINT, IOT_MINT].filter((key) =>
        visibleTokens.has(key.toBase58()),
      ),
    [visibleTokens],
  )

  const onMintSelect = useCallback(
    (mint: PublicKey) => () => setInputMint(mint),
    [],
  )

  return (
    <ReAnimatedBlurBox
      visible
      entering={FadeInFast}
      position="absolute"
      height="100%"
      width="100%"
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
            Insufficient Sol
          </Text>
          <Box width={16 + spacing.m} height={16} />
        </Box>
        <Box flex={1} paddingHorizontal="m" marginTop="l">
          <Text variant="body1Medium" color="white" textAlign="center">
            You currently dont have enough Sol to perform this action. Please
            select one of the following tokens to burn to Sol in order to
            continue.
          </Text>
          <Box
            flexDirection="row"
            justifyContent="space-around"
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
        </Box>
      </SafeAreaBox>
    </ReAnimatedBlurBox>
  )
}

export default memo(() => {
  const { modalType } = useModal()

  if (modalType !== 'InsufficientSolConversion') return null
  return <InsufficientSolConversionModal />
})
