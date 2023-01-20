import React, {
  forwardRef,
  memo,
  ReactNode,
  Ref,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react'
import Checkmark from '@assets/images/checkmark.svg'
import Add from '@assets/images/add.svg'
import { useTranslation } from 'react-i18next'
import { NetTypes } from '@helium/address'
import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetModal,
  BottomSheetModalProvider,
} from '@gorhom/bottom-sheet'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import useLayoutHeight from '../../hooks/useLayoutHeight'
import useBackHandler from '../../hooks/useBackHandler'
import Box from '../../components/Box'
import Text from '../../components/Text'
import { useColors, useOpacity } from '../../theme/themeHooks'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { CSAccount } from '../../storage/cloudStorage'
import AccountIcon from '../../components/AccountIcon'
import { useOnboarding } from '../onboarding/OnboardingProvider'
import { useAppStorage } from '../../storage/AppStorageProvider'
import BackgroundFill from '../../components/BackgroundFill'
import TouchableContainer from '../../components/TouchableContainer'
import { TabBarNavigationProp } from '../../navigation/rootTypes'

export type ConnectedWalletsRef = {
  show: () => void
  hide: () => void
}

type Props = {
  onClose: () => void
  onAddNew: () => void
  children: ReactNode
}

const ConnectedWallets = forwardRef(
  ({ onClose, onAddNew, children }: Props, ref: Ref<ConnectedWalletsRef>) => {
    useImperativeHandle(ref, () => ({ show, hide }))
    const { backgroundStyle } = useOpacity('surfaceSecondary', 1)
    const keyExtractor = useCallback((item) => item.address, [])
    const { primaryText, secondaryText } = useColors()
    const { t } = useTranslation()
    const bottomSheetModalRef = useRef<BottomSheetModal>(null)
    const { handleDismiss, setIsShowing } = useBackHandler(bottomSheetModalRef)
    const [listItemHeight, setListItemHeight] = useLayoutHeight()
    const { sortedAccounts, currentAccount, setCurrentAccount } =
      useAccountStorage()
    const { top } = useSafeAreaInsets()
    const navigation = useNavigation<TabBarNavigationProp>()

    const snapPoints = useMemo(
      () => [
        listItemHeight && sortedAccounts.length
          ? listItemHeight * (sortedAccounts.length + 2) + top
          : '70%',
      ],
      [listItemHeight, sortedAccounts.length, top],
    )
    const { setOnboardingData } = useOnboarding()
    const { enableTestnet } = useAppStorage()

    const show = useCallback(() => {
      bottomSheetModalRef.current?.present()
      setIsShowing(true)
    }, [setIsShowing])

    const hide = useCallback(() => {
      bottomSheetModalRef.current?.dismiss()
    }, [])

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
        // Reset Home & Collectables stack to first screen
        navigation.reset({
          index: 0,
          routes: [{ name: 'Home' }, { name: 'Collectables' }],
        })
        hide()
      },
      [hide, navigation, setCurrentAccount],
    )

    const renderItem = useCallback(
      // eslint-disable-next-line react/no-unused-prop-types
      ({ item }: { index: number; item: CSAccount }) => {
        const isSelected = item.address === currentAccount?.address
        return (
          <TouchableContainer
            onPress={handleAccountChange(item)}
            onLayout={setListItemHeight}
            flexDirection="row"
            paddingHorizontal="l"
            paddingVertical="lm"
            alignItems="center"
          >
            {item.netType === NetTypes.TESTNET && (
              <BackgroundFill backgroundColor="testnet" opacity={0.4} />
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
          </TouchableContainer>
        )
      },
      [currentAccount, handleAccountChange, primaryText, setListItemHeight],
    )

    const footer = useCallback(
      () => (
        <Box>
          <BackgroundFill backgroundColor="secondary" />
          <TouchableContainer
            onPress={handleAddNew(NetTypes.MAINNET)}
            flexDirection="row"
            paddingHorizontal="l"
            paddingVertical="lm"
            borderTopColor="primaryBackground"
            borderTopWidth={1}
            alignItems="center"
          >
            <Add color={primaryText} />
            <Text variant="subtitle1" color="primaryText" marginLeft="m">
              {t('connectedWallets.add')}
            </Text>
          </TouchableContainer>

          {enableTestnet && (
            <TouchableContainer
              onPress={handleAddNew(NetTypes.TESTNET)}
              flexDirection="row"
              paddingHorizontal="l"
              paddingVertical="lm"
              borderTopColor="primaryBackground"
              borderTopWidth={1}
              alignItems="center"
            >
              <BackgroundFill backgroundColor="testnet" opacity={0.4} />
              <Add color={primaryText} />
              <Text variant="subtitle1" color="primaryText" marginLeft="m">
                {t('connectedWallets.addTestnet')}
              </Text>
            </TouchableContainer>
          )}
        </Box>
      ),
      [enableTestnet, handleAddNew, primaryText, t],
    )

    const renderBackdrop = useCallback(
      (props) => (
        <BottomSheetBackdrop
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...props}
        />
      ),
      [],
    )

    const handleModalDismiss = useCallback(() => {
      handleDismiss()
      onClose()
    }, [handleDismiss, onClose])

    const handleIndicatorStyle = useMemo(() => {
      return {
        backgroundColor: secondaryText,
      }
    }, [secondaryText])

    return (
      <BottomSheetModalProvider>
        {children}
        <BottomSheetModal
          ref={bottomSheetModalRef}
          index={0}
          backgroundStyle={backgroundStyle}
          backdropComponent={renderBackdrop}
          snapPoints={snapPoints}
          onDismiss={handleModalDismiss}
          handleIndicatorStyle={handleIndicatorStyle}
        >
          <BottomSheetFlatList
            data={sortedAccounts}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            ListFooterComponent={footer}
            scrollEnabled
          />
        </BottomSheetModal>
      </BottomSheetModalProvider>
    )
  },
)

export default memo(ConnectedWallets)
