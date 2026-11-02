import { Pill } from '@ui/Pill'
import { Card } from '@ui/Card'
import { Image } from '@ui/Image'
import { Text } from '@ui/Text'
import { ArrowUpRight } from 'lucide-react-native'
import React from 'react'
import { View } from 'react-native'
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
          {!!metadata && (
            <View className="shadow-stat-box">
              <Image
                className={
                  metadata.image
                    ? 'size-10 rounded-md bg-primary'
                    : 'size-10 rounded-md bg-secondary'
                }
                source={{ uri: metadata?.image }}
              />
            </View>
          )}
          <Text className="text-[10px]">{ellipsizeAddress(payee)}</Text>
        </View>
        <View className="flex-row items-center">
          <Pill Icon={ArrowUpRight} color="info" />
        </View>
      </View>
    </Card>
  )
}
