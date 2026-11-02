import { useSolOwnedAmount } from '@helium/helium-react-hooks'
import { useBN } from '@hooks/useBN'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { Button } from '@ui/Button'
import { buttonTextVariants } from '@ui/buttonVariants'
import { Spinner } from '@ui/Spinner'
import { SuccessReveal } from '@ui/SuccessReveal'
import { Text } from '@ui/Text'
import { twMerge } from '@ui/twMerge'
import { parseTransactionError } from '@utils/solanaUtils'
import { BlurView } from 'expo-blur'
import { ChevronLeft, CircleCheck } from 'lucide-react-native'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Image, LogBox, Platform, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { FADE_IN, FADE_OUT } from '@theme/motion'
import { SafeAreaView } from 'react-native-safe-area-context'
import 'text-encoding-polyfill'
import { withUniwind } from 'uniwind'
import { TabBarNavigationProp } from '../../navigation/rootTypes'
import { useTransactionBatchStatus } from '../../hooks/useTransactionBatchStatus'
import { Collectable, CompressedNFT } from '../../types/solana'
import { useContentWidth } from '../../utils/layout'
import BackHeader from './components/BackHeader'
import { CollectableStackParamList } from './collectablesTypes'

LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
])

const SafeArea = withUniwind(SafeAreaView)
const Blur = withUniwind(BlurView)
const BackIcon = withUniwind(ChevronLeft)
const SuccessIcon = withUniwind(CircleCheck)

type Route = RouteProp<CollectableStackParamList, 'TransferCompleteScreen'>

const TransferCollectableScreen = () => {
  const route = useRoute<Route>()
  const navigation = useNavigation<TabBarNavigationProp>()
  const COLLECTABLE_HEIGHT = useContentWidth()
  const solBalance = useBN(useSolOwnedAmount(useCurrentWallet()).amount)

  const { t } = useTranslation()
  const { collectable, batchId } = route.params
  const {
    status,
    error: batchError,
    isLoading,
  } = useTransactionBatchStatus(batchId || null)

  const hasError =
    batchError ||
    status === 'failed' ||
    status === 'expired' ||
    status === 'partial'
  const isConfirmed = status === 'confirmed'
  const isPending = isLoading || status === 'pending'

  const compressedNFT = collectable as CompressedNFT
  const nft = collectable as Collectable

  const metadata = compressedNFT?.content?.metadata || nft?.json

  const backgroundImageUri = metadata?.image

  const imageSize = COLLECTABLE_HEIGHT - 160

  const onReturn = () => {
    // Reset Collectables stack to first screen
    navigation.reset({
      index: 0,
      routes: [{ name: 'Collectables' }],
    })
  }

  return (
    <Animated.View className="flex-1 bg-background">
      {/* The blurred NFT image fills the screen behind the content. */}
      {backgroundImageUri && (
        <>
          <Image
            className="absolute inset-0 opacity-70"
            source={{ uri: backgroundImageUri, cache: 'force-cache' }}
            resizeMode="cover"
          />
          <Blur
            className="absolute inset-0"
            intensity={Platform.OS === 'android' ? 15 : 5}
          />
        </>
      )}
      <SafeArea edges={['top']} className="flex-1">
        <BackHeader hideBack onClose={onReturn} className="mt-6" />
        <View className="flex-1 items-center justify-center p-4">
          <View className="mb-8 grow items-center justify-center">
            {metadata && (
              <View className="shadow-lg">
                <Image
                  className={twMerge(
                    'mt-6 rounded-[35px]',
                    metadata.image ? 'bg-primary' : 'bg-secondary',
                  )}
                  style={{ height: imageSize, width: imageSize }}
                  source={{ uri: metadata.image, cache: 'force-cache' }}
                />
              </View>
            )}
            {isConfirmed && (
              <View className="items-center">
                <SuccessReveal
                  icon={
                    <View className="mt-8">
                      <SuccessIcon
                        size={56}
                        colorClassName="accent-success-500"
                      />
                    </View>
                  }
                >
                  <Text size="3xl" className="mt-4">
                    {t('collectablesScreen.transferComplete')}
                  </Text>
                </SuccessReveal>
              </View>
            )}

            {hasError && (
              <Animated.View
                className="items-center"
                entering={FADE_IN}
                exiting={FADE_OUT}
              >
                <Text size="3xl" className="mt-8 text-center">
                  {t('collectablesScreen.transferError')}
                </Text>
                <Text
                  className="mt-8 text-center text-muted-foreground"
                  numberOfLines={2}
                >
                  {parseTransactionError(
                    solBalance,
                    batchError?.message || 'Transaction failed',
                  )}
                </Text>
              </Animated.View>
            )}

            {!batchId && (
              <Animated.View
                className="items-center"
                entering={FADE_IN}
                exiting={FADE_OUT}
              >
                <Text size="3xl" className="mt-8 text-center">
                  {t('collectablesScreen.transferError')}
                </Text>
              </Animated.View>
            )}

            {isPending && (
              <Animated.View
                className="items-center"
                entering={FADE_IN}
                exiting={FADE_OUT}
              >
                <Text size="3xl" className="mt-8 text-center">
                  {t('collectablesScreen.transferingNftTitle')}
                </Text>
                <Text
                  size="xl"
                  className="mb-4 text-center text-muted-foreground"
                >
                  {t('collectablesScreen.transferingNftBody')}
                </Text>
                <Spinner />
              </Animated.View>
            )}
          </View>
          <View className="w-full flex-1 justify-end">
            <Button
              variant="secondary"
              size="dashboard"
              className="mx-4 mb-4"
              onPress={onReturn}
            >
              <BackIcon
                size={16}
                colorClassName="accent-secondary-foreground"
              />
              <Text className={buttonTextVariants({ variant: 'secondary' })}>
                {t('collectablesScreen.returnToCollectables')}
              </Text>
            </Button>
          </View>
        </View>
      </SafeArea>
    </Animated.View>
  )
}

export default TransferCollectableScreen
