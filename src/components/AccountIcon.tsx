import React, { memo, useMemo } from 'react'
import Jazzicon, { IJazziconProps } from 'react-native-jazzicon'
import { getJazzSeed } from '../utils/accountUtils'

type Props = { address?: string; size: number } & Omit<
  IJazziconProps,
  'seed' | 'size'
>
const AccountIcon = ({ address, ...jazzIconProps }: Props) => {
  const seed = useMemo(() => {
    if (!address) return null
    return getJazzSeed(address)
  }, [address])

  if (!seed) return null

  return <Jazzicon {...jazzIconProps} seed={seed} />
}
export default memo(AccountIcon)
