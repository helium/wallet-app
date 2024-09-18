import Send from '@assets/images/send.svg'
import Box from '@components/Box'
import { Pill } from '@components/Pill'
import Text from '@components/Text'
import React, { useMemo } from 'react'
import ImageBox from '@components/ImageBox'
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
  const metadata = useMemo(() => {
    if (isCompressedNFT(collectable)) {
      return collectable.content.metadata
    }

    return collectable.metadata
  }, [collectable])

  return (
    <Box
      backgroundColor="cardBackground"
      borderRadius="2xl"
      mt="4"
      px="4"
      py="3"
      {...{ gap: 8 }}
    >
      <Box
        justifyContent="space-between"
        flexDirection="row"
        alignContent="center"
      >
        <Box flexDirection="row" alignItems="center" {...{ gap: 4 }}>
          {metadata && (
            <Box
              shadowColor="base.black"
              shadowOpacity={0.4}
              shadowOffset={{ width: 0, height: 10 }}
              shadowRadius={10}
              elevation={12}
            >
              <ImageBox
                backgroundColor={metadata.image ? 'black' : 'bg.tertiary'}
                height={40}
                width={40}
                source={{
                  uri: metadata?.image,
                  cache: 'force-cache',
                }}
                borderRadius="2xl"
              />
            </Box>
          )}
          <Text variant="textXsRegular">{ellipsizeAddress(payee)}</Text>
        </Box>
        <Box flexDirection="row" alignItems="center">
          <Pill Icon={Send} color="blue" />
        </Box>
      </Box>
    </Box>
  )
}
