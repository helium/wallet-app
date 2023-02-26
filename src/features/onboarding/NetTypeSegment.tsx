/* eslint-disable react/jsx-props-no-spreading */
import { BoxProps } from '@shopify/restyle'
import * as React from 'react'
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { NetTypes as NetType } from '@helium/address'
import { Platform, Switch } from 'react-native'
import { Theme } from '@theme/theme'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import Text from '@components/Text'
import Box from '@components/Box'
import { useColors, useHitSlop, useSpacing } from '@theme/themeHooks'
import { useOnboarding } from './OnboardingProvider'
import { useAppStorage } from '../../storage/AppStorageProvider'

type Props = BoxProps<Theme>
const NetTypeSegment = (boxProps: Props) => {
  const { t } = useTranslation()
  const { xs: switchMarginHorizontal } = useSpacing()
  const colors = useColors()
  const hitSlop = useHitSlop('l')
  const { onboardingData, setOnboardingData } = useOnboarding()
  const { enableTestnet } = useAppStorage()

  const trackColor = useMemo(
    () => ({ false: colors.secondaryText, true: colors.blueBright500 }),
    [colors],
  )

  const thumbColor = useMemo(() => {
    if (Platform.OS === 'android') {
      return colors.primaryText
    }
    return colors.primaryBackground
  }, [colors.primaryBackground, colors.primaryText])

  const switchStyles = useMemo(() => {
    const container = { transform: [{ rotate: '180deg' }] }

    const shared = {
      marginHorizontal: switchMarginHorizontal,
    }
    const platform =
      Platform.OS === 'android'
        ? undefined
        : { transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }

    return { container, switch: { ...shared, ...platform } }
  }, [switchMarginHorizontal])

  const handleNetTypeChange = useCallback(
    (nextNetType?: NetType.NetType) => () => {
      setOnboardingData((prev) => {
        let netType = nextNetType
        if (netType === undefined) {
          netType =
            prev.netType === NetType.MAINNET ? NetType.TESTNET : NetType.MAINNET
        }
        return { ...prev, netType }
      })
    },
    [setOnboardingData],
  )

  if (!enableTestnet) return null

  return (
    <Box flexDirection="row" alignItems="center" {...boxProps}>
      <TouchableOpacityBox
        onPress={handleNetTypeChange(NetType.MAINNET)}
        paddingVertical="s"
      >
        <Text
          variant="subtitle2"
          color={
            onboardingData.netType === NetType.MAINNET
              ? 'primaryText'
              : 'secondaryText'
          }
        >
          {t('generic.mainnet')}
        </Text>
      </TouchableOpacityBox>
      <Box style={switchStyles.container}>
        <Switch
          style={switchStyles.switch}
          value={onboardingData.netType === NetType.MAINNET}
          onValueChange={handleNetTypeChange()}
          trackColor={trackColor}
          thumbColor={thumbColor}
          hitSlop={hitSlop}
        />
      </Box>
      <TouchableOpacityBox
        onPress={handleNetTypeChange(NetType.TESTNET)}
        paddingVertical="s"
      >
        <Text
          variant="subtitle2"
          color={
            onboardingData.netType === NetType.TESTNET
              ? 'primaryText'
              : 'secondaryText'
          }
        >
          {t('generic.testnet')}
        </Text>
      </TouchableOpacityBox>
    </Box>
  )
}

export default NetTypeSegment
