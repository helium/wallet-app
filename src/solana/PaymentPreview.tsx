import Send from '@assets/images/send.svg'
import { Pill } from '@components/Pill'
import { useMint } from '@helium/helium-react-hooks'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import { PublicKey } from '@solana/web3.js'
import { Card } from '@ui/Card'
import { Text } from '@ui/Text'
import { TokenIcon } from '@ui/TokenIcon'
import { ellipsizeAddress } from '@utils/accountUtils'
import { humanReadable } from '@utils/solanaUtils'
import BN from 'bn.js'
import React from 'react'
import { View } from 'react-native'

interface IPaymentPreviewProps {
  payments: {
    payee: string
    balanceAmount: BN
    max?: boolean
  }[]
  mint: PublicKey
}

export const PaymentPreivew = ({ mint, payments }: IPaymentPreviewProps) => {
  const decimals = useMint(mint)?.info?.decimals
  const { symbol, json } = useMetaplexMetadata(mint)

  return (
    <Card className="mt-4 gap-2 px-4 py-3">
      {payments.map(({ payee, balanceAmount }, index) => (
        <View
          key={`payment-${index}`}
          className="flex-row items-center justify-between"
        >
          <View className="flex-row items-center gap-1">
            {json?.image ? <TokenIcon img={json.image} size={30} /> : null}
            <Text size="base">{symbol}</Text>
            <Text className="text-[10px]">{ellipsizeAddress(payee)}</Text>
          </View>
          <View className="flex-row items-center">
            <Pill
              text={humanReadable(balanceAmount, decimals)}
              Icon={Send}
              color="blue"
            />
          </View>
        </View>
      ))}
    </Card>
  )
}
