import React, { memo, useMemo } from 'react'
import Jazzicon, { IJazziconProps } from 'react-native-jazzicon'
import { getJazzSeed } from '../utils/accountUtils'

type Props = { address?: string; size: number } & Omit<
  IJazziconProps,
  'seed' | 'size'
>
const AccountIcon = ({ address, ...jazzIconProps }: Props) => {
  const seed = useMemo(() => {
    return getJazzSeed(address)
  }, [address])

  // eslint-disable-next-line react/jsx-props-no-spreading
  return <Jazzicon {...jazzIconProps} seed={seed} />
}
export default memo(AccountIcon)
