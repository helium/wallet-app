import React, { useMemo } from 'react'
import Text from '../../components/Text'
import Box from '../../components/Box'
import TouchableOpacityBox, {
  TouchableOpacityBoxProps,
} from '../../components/TouchableOpacityBox'
import Coinbase from '../../assets/images/coinbase.svg'

export type PaymentProvider = 'coinbase' | 'moonpay'

export type BuyTokenListItemProps = {
  provider: PaymentProvider
} & TouchableOpacityBoxProps

const ProviderListItem = ({ provider, ...rest }: BuyTokenListItemProps) => {
  const title = useMemo(() => {
    switch (provider) {
      case 'coinbase':
        return 'Coinbase'
      case 'moonpay':
        return 'Moonpay'
      default:
        return 'Coinbase'
    }
  }, [provider])

  const subtitle = useMemo(() => {
    switch (provider) {
      case 'coinbase':
        return 'Buy or transfer from Coinbase'
      case 'moonpay':
        return 'Card, Apple Pay or bank transfer'
      default:
        return 'Buy or transfer from Coinbase'
    }
  }, [provider])

  const tokenImage = useMemo(() => {
    switch (provider) {
      case 'coinbase':
        return (
          <Box>
            <Coinbase width={60} height={60} />
          </Box>
        )
      case 'moonpay':
        return (
          <Box>
            <Coinbase color="black" width={60} height={60} />
          </Box>
        )
      default:
        return (
          <Box>
            <Coinbase width={60} height={60} />
          </Box>
        )
    }
  }, [provider])

  return (
    <TouchableOpacityBox
      backgroundColor="secondaryBackground"
      flexDirection="row"
      padding="s"
      {...rest}
    >
      {tokenImage}
      <Box
        marginStart="xs"
        flexGrow={1}
        flexBasis={0.5}
        justifyContent="center"
      >
        <Text variant="subtitle4">{title}</Text>
        <Text variant="body3" color="secondaryText">
          {subtitle}
        </Text>
      </Box>
    </TouchableOpacityBox>
  )
}

export default ProviderListItem
