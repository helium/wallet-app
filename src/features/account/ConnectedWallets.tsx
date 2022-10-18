import React, { memo, useCallback } from 'react'
import { FlatList } from 'react-native'
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated'
import TipUp from '@assets/images/tip-up.svg'
import Checkmark from '@assets/images/checkmark.svg'
import Add from '@assets/images/add.svg'
import { useTranslation } from 'react-i18next'
import { NetTypes } from '@helium/address'
import Box from '../../components/Box'
import Text from '../../components/Text'
import TouchableWithoutFeedbackBox from '../../components/TouchableWithoutFeedbackBox'
import { useBorderRadii, useColors, useSpacing } from '../../theme/themeHooks'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { CSAccount } from '../../storage/cloudStorage'
import AccountIcon from '../../components/AccountIcon'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import { useOnboarding } from '../onboarding/OnboardingProvider'
import { useAppStorage } from '../../storage/AppStorageProvider'
import BackgroundFill from '../../components/BackgroundFill'

type Props = {
  onClose: () => void
  onAddNew: () => void
  topOffset: number
}

const ConnectedWallets = ({ onClose, onAddNew, topOffset }: Props) => {
  const keyExtractor = useCallback((item) => item.address, [])
  const { surfaceSecondary, primaryText } = useColors()
  const { t } = useTranslation()
  const { xl: marginHorizontal } = useSpacing()
  const { xl: borderRadius } = useBorderRadii()

  const { sortedAccounts, currentAccount, setCurrentAccount } =
    useAccountStorage()
  const { setOnboardingData } = useOnboarding()
  const { enableTestnet } = useAppStorage()

  const handleNetTypeChange = useCallback(
    (nextNetType?: NetTypes.NetType) => {
      setOnboardingData((prev) => {
        let netType = nextNetType
        if (netType === undefined) {
          netType =
            prev.netType === NetTypes.MAINNET
              ? NetTypes.TESTNET
              : NetTypes.MAINNET
        }
        return { ...prev, netType }
      })
    },
    [setOnboardingData],
  )

  const handleAddNew = useCallback(
    (netType: NetTypes.NetType) => () => {
      handleNetTypeChange(netType)
      onAddNew()
    },
    [handleNetTypeChange, onAddNew],
  )

  const handleAccountChange = useCallback(
    (item: CSAccount) => () => {
      setCurrentAccount(item)
      onClose()
    },
    [onClose, setCurrentAccount],
  )

  const renderItem = useCallback(
    // eslint-disable-next-line react/no-unused-prop-types
    ({ index, item }: { index: number; item: CSAccount }) => {
      const isSelected = item.address === currentAccount?.address
      return (
        <Box
          backgroundColor="secondary"
          borderTopLeftRadius={index === 0 ? 'lx' : 'none'}
          borderTopRightRadius={index === 0 ? 'lx' : 'none'}
        >
          <TouchableOpacityBox
            flexDirection="row"
            paddingHorizontal="l"
            borderTopLeftRadius={index === 0 ? 'lx' : 'none'}
            borderTopRightRadius={index === 0 ? 'lx' : 'none'}
            paddingVertical="lm"
            backgroundColor="surfaceSecondary"
            alignItems="center"
            onPress={handleAccountChange(item)}
          >
            {item.netType === NetTypes.TESTNET && (
              <BackgroundFill
                backgroundColor="testnet"
                opacity={0.4}
                borderTopLeftRadius={index === 0 ? 'lx' : 'none'}
                borderTopRightRadius={index === 0 ? 'lx' : 'none'}
              />
            )}
            <AccountIcon address={item.address} size={25} />
            <Text
              variant="subtitle1"
              color={isSelected ? 'primaryText' : 'secondaryText'}
              marginLeft="m"
            >
              {item.alias}
            </Text>
            <Box flex={1} alignItems="flex-end">
              {isSelected && (
                <Checkmark color={primaryText} height={20} width={20} />
              )}
            </Box>
          </TouchableOpacityBox>
        </Box>
      )
    },
    [currentAccount, handleAccountChange, primaryText],
  )

  const header = useCallback(
    () => (
      <Box alignItems="center">
        <TipUp color={surfaceSecondary} />
      </Box>
    ),
    [surfaceSecondary],
  )
  const footer = useCallback(
    () => (
      <Box>
        <BackgroundFill backgroundColor="secondary" />
        <TouchableOpacityBox
          flexDirection="row"
          backgroundColor="surfaceSecondary"
          paddingHorizontal="l"
          paddingVertical="lm"
          borderTopColor="primaryBackground"
          borderTopWidth={1}
          borderBottomLeftRadius={!enableTestnet ? 'lx' : 'none'}
          borderBottomRightRadius={!enableTestnet ? 'lx' : 'none'}
          onPress={handleAddNew(NetTypes.MAINNET)}
          alignItems="center"
        >
          <Add color={primaryText} />
          <Text variant="subtitle1" color="primaryText" marginLeft="m">
            {t('connectedWallets.add')}
          </Text>
        </TouchableOpacityBox>
        {enableTestnet && (
          <TouchableOpacityBox
            flexDirection="row"
            backgroundColor="surfaceSecondary"
            paddingHorizontal="l"
            paddingVertical="lm"
            borderTopColor="primaryBackground"
            borderTopWidth={1}
            borderBottomLeftRadius="lx"
            borderBottomRightRadius="lx"
            onPress={handleAddNew(NetTypes.TESTNET)}
            alignItems="center"
          >
            <BackgroundFill backgroundColor="testnet" opacity={0.4} />
            <Add color={primaryText} />
            <Text variant="subtitle1" color="primaryText" marginLeft="m">
              {t('connectedWallets.addTestnet')}
            </Text>
          </TouchableOpacityBox>
        )}
      </Box>
    ),
    [enableTestnet, handleAddNew, primaryText, t],
  )

  return (
    <Animated.View
      entering={FadeInUp.springify().mass(0.6)}
      exiting={FadeOutUp.springify()}
      style={{
        flex: 1,
        position: 'absolute',
        top: topOffset,
        bottom: 0,
        left: 0,
        right: 0,
        overflow: 'hidden',
        marginHorizontal,
        zIndex: 999,
      }}
    >
      <Box
        overflow="hidden"
        position="absolute"
        top={0}
        bottom={0}
        left={0}
        right={0}
      >
        <Box
          marginTop="n_xxxs"
          width="100%"
          overflow="hidden"
          borderRadius="xl"
        >
          <FlatList
            ListHeaderComponent={header}
            data={sortedAccounts}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            contentContainerStyle={{
              borderRadius,
              overflow: 'hidden',
            }}
            ListFooterComponent={footer}
          />
        </Box>
        <TouchableWithoutFeedbackBox flex={1} onPress={onClose}>
          <Box flex={1} />
        </TouchableWithoutFeedbackBox>
      </Box>
    </Animated.View>
  )
}

export default memo(ConnectedWallets)
