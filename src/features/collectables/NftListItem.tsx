import React, { useCallback } from 'react'
import { useNavigation } from '@react-navigation/native'
import { Image } from 'react-native'
import Box from '@components/Box'
import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { FADE_IN, FADE_OUT } from '@theme/motion'
import { useBorderRadii } from '@theme/themeHooks'
import CircleLoader from '@components/CircleLoader'
import { ReAnimatedBox } from '@components/AnimatedBox'
import useHaptic from '@hooks/useHaptic'
import { useCollectableHeight } from '../../utils/layout'
import { Collectable } from '../../types/solana'
import { CollectableNavigationProp } from './collectablesTypes'

const NftListItem = ({
  item,
  collectables,
}: {
  item: string
  collectables: Collectable[]
}) => {
  const { lm } = useBorderRadii()
  const collectableHeight = useCollectableHeight()
  const { json } = collectables[0]
  const navigation = useNavigation<CollectableNavigationProp>()
  const { triggerImpact } = useHaptic()

  const handleCollectableNavigation = useCallback(
    (collection: Collectable[]) => () => {
      if (collection.length > 1) {
        triggerImpact('light')
        navigation.navigate('CollectionScreen', {
          collection,
        })
      } else if (json) {
        triggerImpact('light')
        navigation.navigate('NftDetailsScreen', {
          collectable: collection[0],
        })
      }
    },
    [navigation, triggerImpact, json],
  )

  return (
    <ReAnimatedBox style={{ width: '50%' }}>
      <TouchableOpacityBox
        marginHorizontal="s"
        marginVertical="s"
        alignItems="center"
        backgroundColor="surfaceSecondary"
        borderRadius="xxl"
        onPress={handleCollectableNavigation(collectables)}
      >
        <Image
          borderRadius={lm}
          style={{ height: collectableHeight, width: '100%' }}
          source={{
            uri: json?.image || '',
            cache: 'force-cache',
          }}
        />
        <Box
          padding="s"
          position="absolute"
          justifyContent="center"
          alignItems="center"
          backgroundColor="white"
          borderRadius="round"
          bottom={20}
          right={16}
          flexDirection="row"
        >
          <Text variant="subtitle4" color="black" marginRight="xs">
            {item}
          </Text>
          <Text variant="body2" color="secondaryText">
            {collectables?.length}
          </Text>
        </Box>
      </TouchableOpacityBox>
    </ReAnimatedBox>
  )
}

export const NFTSkeleton = () => {
  const collectableHeight = useCollectableHeight()
  return (
    <ReAnimatedBox
      style={{ width: '50%' }}
      entering={FADE_IN}
      exiting={FADE_OUT}
    >
      <TouchableOpacityBox
        marginHorizontal="s"
        marginVertical="s"
        alignItems="center"
      >
        <Box
          backgroundColor="surface"
          borderRadius="xl"
          height={collectableHeight}
          width="100%"
          justifyContent="center"
          alignItems="center"
        >
          <CircleLoader loaderSize={80} />
        </Box>
      </TouchableOpacityBox>
    </ReAnimatedBox>
  )
}

export default NftListItem
