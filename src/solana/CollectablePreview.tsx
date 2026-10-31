import Send from '@assets/images/send.svg'
import { Pill } from '@components/Pill'
import { Card } from '@ui/Card'
import { Text } from '@ui/Text'
import React from 'react'
import { Image, View } from 'react-native'
import { ellipsizeAddress } from '@utils/accountUtils'
import { Collectable, CompressedNFT, isCompressedNFT } from '../types/solana'

interface ICollectablePreviewProps {
  collectable: CompressedNFT | Collectable
  payee: string
}

export const CollectablePreview = ({
  collectable,
  payee,
}: ICollectablePreviewProps) => {
  const metadata = isCompressedNFT(collectable)
    ? collectable.content.metadata
    : collectable.metadata

  return (
    <Card className="mt-4 gap-2 px-4 py-3">
      <View className="flex-row content-center justify-between">
        <View className="flex-row items-center gap-1">
          {metadata && (
            <View className="shadow-stat-box">
              <Image
                className={
                  metadata.image
                    ? 'size-10 rounded-md bg-primary'
                    : 'size-10 rounded-md bg-secondary'
                }
                source={{
                  uri: metadata?.image,
                  cache: 'force-cache',
                }}
              />
            </View>
          )}
          <Text className="text-[10px]">{ellipsizeAddress(payee)}</Text>
        </View>
        <View className="flex-row items-center">
          <Pill Icon={Send} color="blue" />
        </View>
      </View>
    </Card>
  )
}
