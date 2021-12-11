import { utils } from '@helium/crypto-react-native'
import React, { memo, useMemo } from 'react'
import Jazzicon, { IJazziconProps } from 'react-native-jazzicon'

type Props = { address?: string; size: number } & Omit<
  IJazziconProps,
  'seed' | 'size'
>
const AccountIcon = ({ address, ...jazzIconProps }: Props) => {
  const seed = useMemo(() => {
    if (!address) return

    const hexVal = utils.bs58ToBin(address).toString('hex')
    return parseInt(hexVal.slice(-8), 16)
  }, [address])

  // eslint-disable-next-line react/jsx-props-no-spreading
  return <Jazzicon {...jazzIconProps} seed={seed} />
}
export default memo(AccountIcon)
