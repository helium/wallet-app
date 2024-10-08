import Send from '@assets/images/send.svg'
import Receive from '@assets/images/receive.svg'
import Box from '@components/Box'
import CircleLoader from '@components/CircleLoader'
import { Pill } from '@components/Pill'
import Text from '@components/Text'
import TokenIcon from '@components/TokenIcon'
import { useMint } from '@helium/helium-react-hooks'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import { PublicKey } from '@solana/web3.js'
import React from 'react'

interface ISwapPreviewProps {
  inputMint: PublicKey
  inputAmount: number
  outputMint: PublicKey
  outputAmount: number
  minReceived: number
}

export const SwapPreview = ({
  inputMint,
  inputAmount,
  outputMint,
  outputAmount,
  minReceived,
}: ISwapPreviewProps) => {
  const outputDecimals = useMint(outputMint)?.info?.decimals
  const {
    loading: loadingInputMintMetadata,
    symbol: inputMintSymbol,
    json: inputMintJson,
  } = useMetaplexMetadata(inputMint)
  const {
    loading: loadingOutputMintMetadata,
    symbol: outputMintSymbol,
    json: outputMintJson,
  } = useMetaplexMetadata(outputMint)

  return (
    <Box
      backgroundColor="cardBackground"
      borderRadius="2xl"
      mt="4"
      px="4"
      py="3"
      {...{ gap: 8 }}
    >
      {loadingInputMintMetadata || loadingOutputMintMetadata ? (
        <CircleLoader />
      ) : (
        <>
          <Box
            justifyContent="space-between"
            flexDirection="row"
            alignItems="center"
          >
            <Box flexDirection="row" alignItems="center" {...{ gap: 4 }}>
              {inputMintJson ? (
                <TokenIcon img={inputMintJson.image} size={30} />
              ) : null}
              <Text variant="textMdRegular">{inputMintSymbol}</Text>
            </Box>
            <Box flexDirection="row" alignItems="center">
              <Pill text={inputAmount.toString()} Icon={Send} color="blue" />
            </Box>
          </Box>
          <Box
            justifyContent="space-between"
            flexDirection="row"
            alignItems="center"
          >
            <Box flexDirection="row" alignItems="center" {...{ gap: 4 }}>
              {outputMintJson ? (
                <TokenIcon img={outputMintJson.image} size={30} />
              ) : null}
              <Text variant="textMdRegular">{outputMintSymbol}</Text>
            </Box>
            <Box flexDirection="row" alignItems="center">
              <Pill
                text={outputAmount.toString()}
                Icon={Receive}
                color="green"
              />
            </Box>
          </Box>
          <Box
            flexDirection="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Text variant="textSmRegular">Min Received due to slippage:</Text>
            <Text variant="textSmRegular" color="green.500">
              {`~${minReceived.toFixed(outputDecimals)}`}
            </Text>
          </Box>
        </>
      )}
    </Box>
  )
}
