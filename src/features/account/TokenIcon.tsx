import React from 'react'
import TokenHNT from '@assets/images/tokenHNT.svg'
import TokenMOBILE from '@assets/images/tokenMOBILE.svg'
import TokenDC from '@assets/images/tokenDC.svg'
import { useColors } from '../../theme/themeHooks'
import { TokenType } from '../../generated/graphql'

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
  }
}

export default TokenIcon
