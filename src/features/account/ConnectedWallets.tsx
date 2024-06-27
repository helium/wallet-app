import Add from '@assets/images/add.svg'
import Checkmark from '@assets/images/checkmark.svg'
import AccountIcon from '@components/AccountIcon'
import BackgroundFill from '@components/BackgroundFill'
import Box from '@components/Box'
import Text from '@components/Text'
import TouchableContainer from '@components/TouchableContainer'
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetSectionList,
} from '@gorhom/bottom-sheet'
import { NetTypes } from '@helium/address'
import useBackHandler from '@hooks/useBackHandler'
import useLayoutHeight from '@hooks/useLayoutHeight'
import { useNavigation } from '@react-navigation/native'
import { useColors, useOpacity } from '@theme/themeHooks'
import React, {
  ReactNode,
  Ref,
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutChangeEvent } from 'react-native'
import { initialWindowMetrics } from 'react-native-safe-area-context'
import { TabBarNavigationProp } from '../../navigation/rootTypes'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { useAppStorage } from '../../storage/AppStorageProvider'
import { CSAccount } from '../../storage/cloudStorage'
import { useOnboarding } from '../onboarding/OnboardingProvider'

export type ConnectedWalletsRef = {
  show: () => void
  hide: () => void
}

type Props = {
  onClose?: () => void
  onAddNew: () => void
  onAddSub: (acc: CSAccount) => void
  children: ReactNode
}

const ConnectedWallets = forwardRef(
  (
    { onClose, onAddNew, onAddSub, children }: Props,
    ref: Ref<ConnectedWalletsRef>,
  ) => {
    useImperativeHandle(ref, () => ({ show, hide }))
    const { backgroundStyle } = useOpacity('surfaceSecondary', 1)
    const keyExtractor = useCallback((item) => item.address, [])
    const { primaryText, secondaryText } = useColors()
    const { t } = useTranslation()
    const bottomSheetModalRef = useRef<BottomSheetModal>(null)
    const { handleDismiss, setIsShowing } = useBackHandler(bottomSheetModalRef)
    const [listItemHeight, setListItemHeight] = useLayoutHeight()
    const [sectionHeaderHeight, setSectionHeaderHeight] = useLayoutHeight()
    const [footerHeight, setFooterHeight] = useLayoutHeight()
    const [sectionFooterHeights, setSectionFooterHeights] = useState<{
      [key: string]: number
    }>({})
    const sectionFooterHeight = useMemo(
      () =>
        Object.values(sectionFooterHeights).reduce(
          (acc, height) => acc + height,
          0,
        ),
      [sectionFooterHeights],
    )

    const { sortedAccounts, currentAccount, setCurrentAccount } =
      useAccountStorage()
    useEffect(() => {
      const hashes = new Set(
        sortedAccounts.map((a) => a.mnemonicHash || 'none'),
      )
      setSectionFooterHeights((prev) =>
        Object.entries(prev)
          .filter(([key]) => hashes.has(key))
          .reduce((acc, [key, height]) => ({ ...acc, [key]: height }), {}),
      )
    }, [sortedAccounts])
    const navigation = useNavigation<TabBarNavigationProp>()
    const { enableTestnet } = useAppStorage()

    const filteredAccounts = useMemo(() => {
      const grouped = sortedAccounts
        .filter((a) => a.netType !== NetTypes.TESTNET)
        .reduce((acc, account) => {
          acc[account.mnemonicHash || 'none'] = [
            ...(acc[account.mnemonicHash || 'none'] || []),
            account,
          ]
          return acc
        }, {} as { [key: string]: CSAccount[] })

      const { none, ...rest } = grouped
      return [
        ...Object.values(rest).map((accounts, index) => ({
          title: `Seed Phrase ${index + 1}`,
          data: accounts,
        })),
        {
          title: 'Private Keys',
          data: none,
        },
      ]
    }, [sortedAccounts])

    const snapPoints = useMemo(() => {
      const totalHeight =
        listItemHeight &&
        footerHeight &&
        sectionHeaderHeight &&
        sortedAccounts.length &&
        listItemHeight * (sortedAccounts.length + (enableTestnet ? 2 : 1)) +
          footerHeight +
          sectionHeaderHeight * filteredAccounts.length +
          sectionFooterHeight

      return [
        totalHeight &&
        totalHeight < 0.7 * (initialWindowMetrics?.frame.height || 0)
          ? totalHeight
          : '70%',
      ]
    }, [
      footerHeight,
      enableTestnet,
      filteredAccounts,
      listItemHeight,
      sortedAccounts.length,
      sectionFooterHeight,
      sectionHeaderHeight,
    ])

    const { setOnboardingData } = useOnboarding()

    const show = useCallback(() => {
      bottomSheetModalRef.current?.present()
      setIsShowing(true)
    }, [setIsShowing])

    const hide = useCallback(() => {
      bottomSheetModalRef.current?.dismiss()
      setIsShowing(false)
    }, [setIsShowing])

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
        hide()
        handleNetTypeChange(netType)
        onAddNew()
      },
      [handleNetTypeChange, onAddNew, hide],
    )

    const handleAccountChange = useCallback(
      (item: CSAccount) => () => {
        hide()
        setCurrentAccount(item)
        // Reset Home & Collectables stack to first screen
        navigation.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        })
      },
      [hide, setCurrentAccount, navigation],
    )

    const renderItem = useCallback(
      // eslint-disable-next-line react/no-unused-prop-types
      ({ item }: { index: number; item: CSAccount }) => {
        const isSelected = item.address === currentAccount?.address
        const accountAddress = item?.solanaAddress
        return (
          <TouchableContainer
            onPress={handleAccountChange(item)}
            onLayout={setListItemHeight}
            flexDirection="row"
            paddingHorizontal="l"
            paddingVertical="lm"
            paddingLeft="xxl"
            alignItems="center"
          >
            {item.netType === NetTypes.TESTNET && (
              <BackgroundFill backgroundColor="testnet" opacity={0.4} />
            )}
            <AccountIcon address={accountAddress} size={25} />
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
      [
        currentAccount?.address,
        handleAccountChange,
        primaryText,
        setListItemHeight,
      ],
    )

    const footer = useCallback(
      () => (
        <Box onLayout={setFooterHeight}>
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
      [enableTestnet, handleAddNew, primaryText, t, setFooterHeight],
    )

    const renderBackdrop = useCallback(
      (props) => (
        <BottomSheetBackdrop
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          pressBehavior="close"
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...props}
        />
      ),
      [],
    )

    const handleModalDismiss = useCallback(() => {
      handleDismiss()
      if (onClose) {
        onClose()
      }
    }, [handleDismiss, onClose])

    const handleIndicatorStyle = useMemo(() => {
      return {
        backgroundColor: secondaryText,
      }
    }, [secondaryText])

    const sectionFooter = useCallback(
      ({ section: { data } }) => {
        return (
          <SectionFooter
            data={data}
            onAddSub={onAddSub}
            onLayout={(height) => {
              setSectionFooterHeights((prev) => {
                const newHeight = { ...prev }
                newHeight[data[0].mnemonicHash || 'none'] =
                  height.nativeEvent.layout.height
                return newHeight
              })
            }}
          />
        )
      },
      [onAddSub],
    )

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
          <BottomSheetSectionList
            sections={filteredAccounts}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            ListFooterComponent={footer}
            scrollEnabled
            renderSectionHeader={({ section: { title } }) => (
              <Box
                onLayout={setSectionHeaderHeight}
                flexDirection="row"
                alignItems="center"
                backgroundColor="surfaceSecondary"
                paddingHorizontal="l"
              >
                <Text variant="subtitle1">{title}</Text>
              </Box>
            )}
            renderSectionFooter={sectionFooter}
          />
        </BottomSheetModal>
      </BottomSheetModalProvider>
    )
  },
)

const SectionFooter: React.FC<{
  data: CSAccount[]
  onAddSub: (acc: CSAccount) => void
  onLayout: (height: LayoutChangeEvent) => void
}> = ({ data, onAddSub, onLayout }) => {
  const handleAddSub = useCallback(() => {
    if (data[0] && data[0].mnemonicHash) {
      onAddSub(data[data.length - 1])
    }
  }, [data, onAddSub])
  const { primaryText } = useColors()
  const { t } = useTranslation()
  return (
    <Box onLayout={onLayout}>
      {data[0] && data[0].mnemonicHash ? (
        <TouchableContainer
          onPress={handleAddSub}
          flexDirection="row"
          paddingHorizontal="l"
          paddingLeft="xxl"
          paddingVertical="lm"
          alignItems="center"
        >
          <Add color={primaryText} />
          <Text variant="subtitle1" color="primaryText" marginLeft="m">
            {t('connectedWallets.addSub')}
          </Text>
        </TouchableContainer>
      ) : null}
    </Box>
  )
}

export default memo(ConnectedWallets)
