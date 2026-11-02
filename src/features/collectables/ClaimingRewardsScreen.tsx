import { useSolOwnedAmount } from '@helium/helium-react-hooks'
import { useBN } from '@hooks/useBN'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { AccountIcon } from '@ui/AccountIcon'
import { Button } from '@ui/Button'
import { buttonTextVariants } from '@ui/buttonVariants'
import { Spinner } from '@ui/Spinner'
import { SuccessReveal } from '@ui/SuccessReveal'
import { Text } from '@ui/Text'
import { parseTransactionError } from '@utils/solanaUtils'
import { ChevronLeft, CircleCheck } from 'lucide-react-native'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import Animated from 'react-native-reanimated'
import { FADE_IN, FADE_OUT } from '@theme/motion'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import 'text-encoding-polyfill'
import { withUniwind } from 'uniwind'
import { useTransactionBatchesStatus } from '../../hooks/useTransactionBatchStatus'
import { TabBarNavigationProp } from '../../navigation/rootTypes'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { CollectableStackParamList } from './collectablesTypes'

const BackIcon = withUniwind(ChevronLeft)
const SuccessIcon = withUniwind(CircleCheck)

const ClaimingRewardsScreen = () => {
  const route =
    useRoute<RouteProp<CollectableStackParamList, 'ClaimingRewardsScreen'>>()
  const { currentAccount } = useAccountStorage()
  const navigation = useNavigation<TabBarNavigationProp>()
  const wallet = useCurrentWallet()
  const solBalance = useBN(useSolOwnedAmount(wallet).amount)
  const { bottom } = useSafeAreaInsets()
  const { t } = useTranslation()
  const {
    status,
    error: batchError,
    isLoading,
  } = useTransactionBatchesStatus(route.params?.batchIds ?? null)

  const hasError =
    batchError ||
    status === 'failed' ||
    status === 'expired' ||
    status === 'partial'
  const isConfirmed = status === 'confirmed'
  const isPending = isLoading || status === 'pending'
  const onReturn = () => {
    // Reset Collectables stack to first screen
    navigation.reset({
      index: 0,
      routes: [{ name: 'Collectables' }],
    })
  }

  if (!currentAccount) {
    return null
  }

  return (
    <Animated.View className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center">
        <View className="grow items-center justify-center">
          <View className="p-4 shadow-lg">
            <AccountIcon address={currentAccount?.solanaAddress} size={76} />
          </View>
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
                <Text size="4xl" className="mt-4 font-medium">
                  {t('collectablesScreen.claimComplete')}
                </Text>
                <Text
                  className="mt-8 text-center text-muted-foreground"
                  numberOfLines={2}
                >
                  {t('collectablesScreen.claimCompleteBody')}
                </Text>
              </SuccessReveal>
            </View>
          )}

          {hasError ? (
            <Animated.View
              className="items-center"
              entering={FADE_IN}
              exiting={FADE_OUT}
            >
              <View className="p-4">
                <Text size="3xl" className="text-center font-medium">
                  {t('collectablesScreen.rewardsError')}
                </Text>
                <Text
                  className="mt-4 text-center text-muted-foreground"
                  numberOfLines={2}
                >
                  {parseTransactionError(
                    solBalance,
                    batchError?.message || 'Transaction failed',
                  )}
                </Text>
              </View>
            </Animated.View>
          ) : null}

          {!route.params?.batchIds?.length ? (
            <Animated.View
              className="items-center"
              entering={FADE_IN}
              exiting={FADE_OUT}
            >
              <View className="p-4">
                <Text size="4xl" className="mt-8 text-center font-medium">
                  {t('collectablesScreen.rewardsError')}
                </Text>
              </View>
            </Animated.View>
          ) : null}

          {isPending ? (
            <Animated.View
              className="items-center"
              entering={FADE_IN}
              exiting={FADE_OUT}
            >
              <View className="mb-4 px-4">
                <Text size="3xl" className="text-center font-medium">
                  {t('collectablesScreen.claimingRewards')}
                </Text>
                <Text
                  size="base"
                  className="mt-2 text-center text-muted-foreground"
                >
                  {t('collectablesScreen.claimingRewardsBody')}
                </Text>
              </View>

              <View className="mx-12 mt-4">
                <Spinner size="large" />
              </View>
            </Animated.View>
          ) : null}
        </View>
        <View className="w-full justify-end" style={{ marginBottom: bottom }}>
          <Button
            variant="secondary"
            size="dashboard"
            className="mx-4 mb-4"
            onPress={onReturn}
          >
            <BackIcon size={16} colorClassName="accent-secondary-foreground" />
            <Text className={buttonTextVariants({ variant: 'secondary' })}>
              {t('collectablesScreen.returnToCollectables')}
            </Text>
          </Button>
        </View>
      </View>
    </Animated.View>
  )
}

export default ClaimingRewardsScreen
