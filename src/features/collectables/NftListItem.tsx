import React, { useCallback } from 'react'
import { useNavigation } from '@react-navigation/native'
import { Image } from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import Box from '@components/Box'
import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import CircleLoader from '@components/CircleLoader'
import { ReAnimatedBox } from '@components/AnimatedBox'
import useHaptic from '@hooks/useHaptic'
import { useBorderRadii } from '@config/theme/themeHooks'
import useLayoutWidth from '@hooks/useLayoutWidth'
import { ww } from '../../utils/layout'
import { Collectable } from '../../types/solana'
import { CollectableNavigationProp } from './collectablesTypes'

const COLLECTABLE_HEIGHT = ww / 2
const NftListItem = ({
  item,
  collectables,
}: {
  item: string
  collectables: Collectable[]
}) => {
  const { content } = collectables[0]
  const navigation = useNavigation<CollectableNavigationProp>()
  const { triggerImpact } = useHaptic()
  const borderRadii = useBorderRadii()
  const [height, setHeight] = useLayoutWidth()

  const handleCollectableNavigation = useCallback(
    (collection: Collectable[]) => () => {
      if (collection.length > 1) {
        triggerImpact('light')
        navigation.navigate('CollectionScreen', {
          collection,
        })
      } else if (content?.metadata) {
        triggerImpact('light')
        navigation.navigate('NftDetailsScreen', {
          collectable: collection[0],
        })
      }
    },
    [navigation, triggerImpact, content],
  )

  return (
    <TouchableOpacityBox
      alignItems="center"
      flex={1}
      backgroundColor="bg.tertiary"
      borderRadius="4xl"
      onPress={handleCollectableNavigation(collectables)}
      onLayout={setHeight}
    >
      <Image
        borderRadius={borderRadii['2xl']}
        style={{ height: height || '100%', width: '100%' }}
        source={{
          uri: content?.files?.[0]?.uri || '',
          cache: 'force-cache',
        }}
      />
      <Box
        padding="2"
        position="absolute"
        justifyContent="center"
        alignItems="center"
        backgroundColor="base.white"
        borderRadius="full"
        bottom={20}
        right={16}
        flexDirection="row"
      >
        <Text variant="textSmMedium" color="primaryText" marginRight="xs">
          {item}
        </Text>
        <Text variant="textSmRegular" color="secondaryText">
          {collectables?.length}
        </Text>
      </Box>
    </TouchableOpacityBox>
  )
}

export const NFTSkeleton = () => {
  return (
    <ReAnimatedBox style={{ width: '50%' }} entering={FadeIn} exiting={FadeOut}>
      <TouchableOpacityBox
        marginHorizontal="2"
        marginVertical="2"
        alignItems="center"
      >
        <Box
          backgroundColor="cardBackground"
          borderRadius="4xl"
          height={COLLECTABLE_HEIGHT}
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
