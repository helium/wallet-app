import { Pill } from '@ui/Pill'
import { useMint } from '@helium/helium-react-hooks'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import { PublicKey } from '@solana/web3.js'
import { Card } from '@ui/Card'
import { Spinner } from '@ui/Spinner'
import { Text } from '@ui/Text'
import { TokenIcon } from '@ui/TokenIcon'
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react-native'
import React from 'react'
import { View } from 'react-native'

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
    <Card className="mt-4 gap-2 px-4 py-3">
      {loadingInputMintMetadata || loadingOutputMintMetadata ? (
        <Spinner />
      ) : (
        <>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-1">
              {inputMintJson ? (
                <TokenIcon img={inputMintJson.image} size={30} />
              ) : null}
              <Text size="base">{inputMintSymbol}</Text>
            </View>
            <View className="flex-row items-center">
              <Pill
                text={inputAmount.toString()}
                Icon={ArrowUpRight}
                color="info"
              />
            </View>
          </View>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-1">
              {outputMintJson ? (
                <TokenIcon img={outputMintJson.image} size={30} />
              ) : null}
              <Text size="base">{outputMintSymbol}</Text>
            </View>
            <View className="flex-row items-center">
              <Pill
                text={outputAmount.toString()}
                Icon={ArrowDownLeft}
                color="success"
              />
            </View>
          </View>
          <View className="flex-row items-center justify-between">
            <Text>Min Received due to slippage:</Text>
            <Text className="text-success-500">
              {`~${minReceived.toFixed(outputDecimals)}`}
            </Text>
          </View>
        </>
      )}
    </Card>
  )
}
