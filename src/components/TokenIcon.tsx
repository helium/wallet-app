import React from 'react'
import TokenHNT from '@assets/images/tokenHNT.svg'
import TokenMOBILE from '@assets/images/tokenMOBILE.svg'
import TokenDC from '@assets/images/tokenDC.svg'
import TokenSOL from '@assets/images/tokenSolana.svg'
import TokenIOT from '@assets/images/tokenIOT.svg'
import { Ticker } from '@helium/currency'
import { useColors } from '@theme/themeHooks'
import Box from './Box'
import BackgroundFill from './BackgroundFill'

type Props = {
  ticker: Ticker
  size?: number
}

const TokenIcon = ({ ticker, size = 40 }: Props) => {
  const colors = useColors()

  switch (ticker) {
    default:
    case 'HNT':
      return <TokenHNT color={colors.white} width={size} height={size} />
    case 'MOBILE':
      return <TokenMOBILE width={size} height={size} />
    case 'IOT':
      return <TokenIOT width={size} height={size} />
    case 'DC':
      return <TokenDC width={size} height={size} />
    case 'HST':
      return <TokenHNT color={colors.purple500} width={size} height={size} />
    case 'SOL':
      return (
        <Box
          width={size}
          height={size}
          alignItems="center"
          justifyContent="center"
          borderRadius="round"
          overflow="hidden"
        >
          <BackgroundFill backgroundColor="solanaPurple" opacity={0.35} />
          <TokenSOL width={size * 0.5} height={size * 0.5} />
        </Box>
      )
  }
}

export default TokenIcon
