import { NetTypes as NetType } from '@helium/address'
import { PressableScale } from '@ui/PressableScale'
import { Text } from '@ui/Text'
import { twMerge } from '@ui/twMerge'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Platform, Switch, View } from 'react-native'
import { useAppStorage } from '../../storage/AppStorageProvider'
import { useOnboarding } from './OnboardingProvider'

const NetTypeSegment = ({ className }: { className?: string }) => {
  const { t } = useTranslation()
  const { onboardingData, setOnboardingData } = useOnboarding()
  const { enableTestnet } = useAppStorage()

  const handleNetTypeChange = (nextNetType?: NetType.NetType) => () => {
    setOnboardingData((prev) => {
      let netType = nextNetType
      if (netType === undefined) {
        netType =
          prev.netType === NetType.MAINNET ? NetType.TESTNET : NetType.MAINNET
      }
      return { ...prev, netType }
    })
  }

  const netTypeClassName = (netType: NetType.NetType) =>
    onboardingData.netType === netType
      ? 'text-navy-foreground'
      : 'text-navy-foreground/50'

  if (!enableTestnet) return null

  return (
    <View className={twMerge('flex-row items-center', className)}>
      <PressableScale
        feedback="opacity"
        className="py-2"
        onPress={handleNetTypeChange(NetType.MAINNET)}
      >
        <Text size="base" className={netTypeClassName(NetType.MAINNET)}>
          {t('generic.mainnet')}
        </Text>
      </PressableScale>
      <View
        className={twMerge(
          'mx-1 rotate-180',
          Platform.OS === 'ios' && 'scale-80',
        )}
      >
        <Switch
          value={onboardingData.netType === NetType.MAINNET}
          onValueChange={handleNetTypeChange()}
          hitSlop={24}
        />
      </View>
      <PressableScale
        feedback="opacity"
        className="py-2"
        onPress={handleNetTypeChange(NetType.TESTNET)}
      >
        <Text size="base" className={netTypeClassName(NetType.TESTNET)}>
          {t('generic.testnet')}
        </Text>
      </PressableScale>
    </View>
  )
}

export default NetTypeSegment
