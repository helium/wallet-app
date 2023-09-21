import { useContext } from 'react'
import { TokenListContext } from '../storage/TokenListProvider'

export const useTokenList = () => {
  return useContext(TokenListContext)
}
