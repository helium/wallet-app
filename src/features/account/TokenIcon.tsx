import React from 'react'
import TokenHNT from '@assets/images/tokenHNT.svg'
import TokenMOBILE from '@assets/images/tokenMOBILE.svg'
import TokenDC from '@assets/images/tokenDC.svg'
import TokenSOL from '@assets/images/tokenSolana.svg'
import { useColors } from '../../theme/themeHooks'
import Box from '../../components/Box'
import BackgroundFill from '../../components/BackgroundFill'
import { TokenType } from '../../types/activity'

type Props = {
  tokenType: TokenType
  size?: number
}

const TokenIcon = ({ tokenType, size = 40 }: Props) => {
  const colors = useColors()

  switch (tokenType) {
    default:
    case TokenType.Hnt:
      return <TokenHNT color={colors.white} width={size} height={size} />
    case TokenType.Mobile:
      return <TokenMOBILE width={size} height={size} />
    case TokenType.Dc:
      return <TokenDC width={size} height={size} />
    case TokenType.Hst:
      return <TokenHNT color={colors.purple500} width={size} height={size} />
    case TokenType.Sol:
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
