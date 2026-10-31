import { CloseButton } from '@ui/CloseButton'
import { useSolOwnedAmount } from '@helium/helium-react-hooks'
import { useBN } from '@hooks/useBN'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import { usePublicKey } from '@hooks/usePublicKey'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { Button } from '@ui/Button'
import { buttonTextVariants } from '@ui/buttonVariants'
import { Spinner } from '@ui/Spinner'
import { Text } from '@ui/Text'
import { TokenIcon } from '@ui/TokenIcon'
import { parseTransactionError } from '@utils/solanaUtils'
import { ChevronLeft, ChevronRight } from 'lucide-react-native'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import Animated from 'react-native-reanimated'
import { FADE_IN, FADE_OUT } from '@theme/motion'
import { SafeAreaView } from 'react-native-safe-area-context'
import { withUniwind } from 'uniwind'
import 'text-encoding-polyfill'
import { TabBarNavigationProp } from '../../navigation/rootTypes'
import { useTransactionBatchStatus } from '../../hooks/useTransactionBatchStatus'
import { SwapStackParamList } from './swapTypes'

const SafeArea = withUniwind(SafeAreaView)
const ArrowIcon = withUniwind(ChevronRight)
const BackIcon = withUniwind(ChevronLeft)

type Route = RouteProp<SwapStackParamList, 'SwappingScreen'>

const SwappingScreen = () => {
  const route = useRoute<Route>()
  const navigation = useNavigation<TabBarNavigationProp>()
  const solBalance = useBN(useSolOwnedAmount(useCurrentWallet()).amount)

  const { t } = useTranslation()
  const { tokenA, tokenB, batchId } = route.params
  const { json: jsonA } = useMetaplexMetadata(usePublicKey(tokenA))
  const { json: jsonB } = useMetaplexMetadata(usePublicKey(tokenB))

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

  const onReturn = () => {
    // Reset Swap stack to first screen
    navigation.goBack()
  }

  return (
    <View className="flex-1 bg-background">
      <SafeArea edges={['bottom']} className="flex-1 px-6">
        <View className="mt-6 flex-row items-center justify-end">
          <CloseButton onPress={onReturn} />
        </View>
        <View className="grow items-center justify-center">
          <View className="flex-row items-center">
            <View className="me-4 rounded-full bg-secondary p-2">
              <TokenIcon img={jsonA?.image} size={50} />
            </View>
            <ArrowIcon size={24} colorClassName="accent-muted-foreground" />
            <View className="ms-4 rounded-full bg-secondary p-2">
              <TokenIcon img={jsonB?.image} size={50} />
            </View>
          </View>
          {isConfirmed && (
            <Animated.View
              className="items-center"
              entering={FADE_IN}
              exiting={FADE_OUT}
            >
              <Text size="3xl" className="mt-8 font-medium">
                {t('swapsScreen.swapComplete')}
              </Text>
              <Text
                size="base"
                className="mt-8 text-center text-muted-foreground"
              >
                {t('swapsScreen.swapCompleteBody')}
              </Text>
            </Animated.View>
          )}

          {hasError && (
            <Animated.View
              className="items-center"
              entering={FADE_IN}
              exiting={FADE_OUT}
            >
              <Text size="3xl" className="mt-8 text-center font-medium">
                {t('swapsScreen.swapError')}
              </Text>
              <Text className="mt-8 text-center text-muted-foreground">
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
              <Text size="3xl" className="mt-8 text-center font-medium">
                {t('swapsScreen.swapError')}
              </Text>
            </Animated.View>
          )}

          {isPending && (
            <Animated.View
              className="items-center"
              entering={FADE_IN}
              exiting={FADE_OUT}
            >
              <Text size="3xl" className="mt-8 text-center font-medium">
                {t('swapsScreen.swappingTokens')}
              </Text>
              <Text
                size="xl"
                className="mt-4 text-center text-muted-foreground"
              >
                {t('swapsScreen.swappingTokensBody')}
              </Text>
              <Spinner size="large" className="mt-8" />
            </Animated.View>
          )}
        </View>
        <View className="w-full justify-end pt-6">
          <Button
            variant="secondary"
            size="lg"
            className="mx-4 mb-8"
            onPress={onReturn}
          >
            <BackIcon size={16} colorClassName="accent-secondary-foreground" />
            <Text className={buttonTextVariants({ variant: 'secondary' })}>
              {t('swapsScreen.returnToSwaps')}
            </Text>
          </Button>
        </View>
      </SafeArea>
    </View>
  )
}

export default SwappingScreen
