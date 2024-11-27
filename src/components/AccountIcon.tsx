import React, { memo, useMemo } from 'react'
import Jazzicon, { IJazziconProps } from 'react-native-jazzicon'
import { useAccountStorage } from '@config/storage/AccountStorageProvider'
import { useAsync } from 'react-async-hook'
import { getJazzSeed } from '../utils/accountUtils'
import { ImageBox } from '.'

type Props = { address?: string; size: number } & Omit<
  IJazziconProps,
  'seed' | 'size'
>
const AccountIcon = ({ address, ...jazzIconProps }: Props) => {
  const { getAvatar, currentAccount } = useAccountStorage()

  const { result: avatar } = useAsync(async () => {
    if (!address) return
    return getAvatar(address)
  }, [address, currentAccount])

  const seed = useMemo(() => {
    if (!address) return null
    return getJazzSeed(address)
  }, [address])

  if (!seed) return null

  if (avatar) {
    return (
      <ImageBox
        width={jazzIconProps.size}
        height={jazzIconProps.size}
        borderRadius="full"
        source={{ uri: avatar }}
      />
    )
  }

  return <Jazzicon {...jazzIconProps} seed={seed} />
}
export default memo(AccountIcon)
