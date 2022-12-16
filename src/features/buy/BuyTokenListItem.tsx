import React, { useMemo } from 'react'
import { Ticker } from '@helium/currency'
import Text from '../../components/Text'
import Box from '../../components/Box'
import TouchableOpacityBox, {
  TouchableOpacityBoxProps,
} from '../../components/TouchableOpacityBox'
import SolanaCircle from '../../assets/images/solanaCircle.svg'

export type BuyTokenListItemProps = {
  token: Ticker
} & TouchableOpacityBoxProps

const BuyTokenListItem = ({ token, ...rest }: BuyTokenListItemProps) => {
  const title = useMemo(() => {
    switch (token) {
      case 'SOL':
        return 'Solana'
      case 'HNT':
        return 'Helium'
      case 'MOBILE':
        return 'Mobile'
      case 'IOT':
        return 'IoT'
      default:
        return 'Solana'
    }
  }, [token])

  const subtitle = useMemo(() => {
    return token
  }, [token])

  const tokenImage = useMemo(() => {
    switch (token) {
      case 'SOL':
        return (
          <Box>
            <SolanaCircle color="black" width={40} height={40} />
          </Box>
        )
      default:
        return (
          <Box>
            <SolanaCircle color="black" width={40} height={40} />
          </Box>
        )
    }
  }, [token])

  return (
    <TouchableOpacityBox
      backgroundColor="secondaryBackground"
      flexDirection="row"
      padding="m"
      {...rest}
    >
      {tokenImage}
      <Box marginStart="s" flexGrow={1} flexBasis={0.5} justifyContent="center">
        <Text variant="subtitle4">{title}</Text>
        <Text variant="body3" color="secondaryText">
          {subtitle}
        </Text>
      </Box>
    </TouchableOpacityBox>
  )
}

export default BuyTokenListItem
