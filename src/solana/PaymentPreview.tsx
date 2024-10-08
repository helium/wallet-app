import Send from '@assets/images/send.svg'
import Box from '@components/Box'
import { Pill } from '@components/Pill'
import Text from '@components/Text'
import TokenIcon from '@components/TokenIcon'
import { useMint } from '@helium/helium-react-hooks'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import { PublicKey } from '@solana/web3.js'
import { ellipsizeAddress } from '@utils/accountUtils'
import { humanReadable } from '@utils/solanaUtils'
import BN from 'bn.js'
import React from 'react'

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
    <Box
      backgroundColor="cardBackground"
      borderRadius="2xl"
      mt="4"
      px="4"
      py="3"
      {...{ gap: 8 }}
    >
      {payments.map(({ payee, balanceAmount }, index) => (
        <Box
          // eslint-disable-next-line react/no-array-index-key
          key={`payment-${index}`}
          justifyContent="space-between"
          flexDirection="row"
          alignItems="center"
        >
          <Box flexDirection="row" alignItems="center" gap="4">
            {json?.image ? <TokenIcon img={json.image} size={30} /> : null}
            <Text color="primaryText" variant="textMdSemibold">
              {symbol}
            </Text>
            <Text color="secondaryText" variant="textXsRegular">
              {ellipsizeAddress(payee)}
            </Text>
          </Box>
          <Box flexDirection="row" alignItems="center">
            <Pill
              text={humanReadable(balanceAmount, decimals)}
              Icon={Send}
              color="blue"
            />
          </Box>
        </Box>
      ))}
    </Box>
  )
}
