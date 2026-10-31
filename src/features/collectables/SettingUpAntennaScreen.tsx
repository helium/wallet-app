import React from 'react'
import { useAccountStorage } from '@storage/AccountStorageProvider'
import { useNavigation, RouteProp, useRoute } from '@react-navigation/native'
import { TabBarNavigationProp } from 'src/navigation/rootTypes'
import { AccountIcon } from '@ui/AccountIcon'
import { Button } from '@ui/Button'
import { buttonTextVariants } from '@ui/buttonVariants'
import { Spinner } from '@ui/Spinner'
import { Text } from '@ui/Text'
import { ChevronLeft } from 'lucide-react-native'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import Animated from 'react-native-reanimated'
import { FADE_IN, FADE_OUT } from '@theme/motion'
import { parseTransactionError } from '@utils/solanaUtils'
import { useBN } from '@hooks/useBN'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import { useSolOwnedAmount } from '@helium/helium-react-hooks'
import { withUniwind } from 'uniwind'
import { useTransactionBatchStatus } from '../../hooks/useTransactionBatchStatus'
import { CollectableStackParamList } from './collectablesTypes'

const BackIcon = withUniwind(ChevronLeft)

const SettingUpAntennaScreen = () => {
  const route =
    useRoute<RouteProp<CollectableStackParamList, 'SettingUpAntennaScreen'>>()
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
  } = useTransactionBatchStatus(route.params?.batchId || null)

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
    <Animated.View className="flex-1 bg-secondary">
      <View className="flex-1 items-center justify-center p-4">
        <View className="grow items-center justify-center">
          <View className="shadow-lg">
            <AccountIcon address={currentAccount?.solanaAddress} size={76} />
          </View>
          {(!route.params?.batchId || isConfirmed) && (
            <Animated.View
              className="items-center"
              entering={FADE_IN}
              exiting={FADE_OUT}
            >
              <Text size="4xl" className="mt-8 font-medium">
                {t('antennaSetupScreen.settingUpComplete')}
              </Text>
              <Text
                className="mt-8 text-center text-muted-foreground"
                numberOfLines={2}
              >
                {t('antennaSetupScreen.settingUpCompleteBody')}
              </Text>
            </Animated.View>
          )}

          {hasError && (
            <Animated.View
              className="items-center"
              entering={FADE_IN}
              exiting={FADE_OUT}
            >
              <Text size="4xl" className="mt-8 text-center font-medium">
                {t('collectablesScreen.rewardsError')}
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

          {isPending && (
            <Animated.View
              className="items-center"
              entering={FADE_IN}
              exiting={FADE_OUT}
            >
              <Text size="4xl" className="mt-8 text-center font-medium">
                {t('antennaSetupScreen.settingUp')}
              </Text>
              <Text
                size="xl"
                className="mb-4 mt-2 text-center text-muted-foreground"
              >
                {t('antennaSetupScreen.settingUpBody')}
              </Text>
              <View className="mx-12 mt-4">
                <Spinner size="large" />
              </View>
            </Animated.View>
          )}
        </View>
        <View className="w-full justify-end" style={{ marginBottom: bottom }}>
          <Button
            variant="secondary"
            size="lg"
            className="mx-4 mb-4"
            onPress={onReturn}
            disabled={isPending}
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

export default SettingUpAntennaScreen
