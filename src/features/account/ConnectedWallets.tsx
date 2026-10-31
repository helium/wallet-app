import {
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetSectionList,
} from '@gorhom/bottom-sheet'
import { NetTypes } from '@helium/address'
import useLayoutHeight from '@hooks/useLayoutHeight'
import { useNavigation } from '@react-navigation/native'
import { AccountIcon } from '@ui/AccountIcon'
import { PressableScale } from '@ui/PressableScale'
import { Sheet } from '@ui/Sheet'
import { Text } from '@ui/Text'
import { useContentColumnMargins } from '@utils/layout'
import { Check, Plus } from 'lucide-react-native'
import React, { ReactNode, useImperativeHandle, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutChangeEvent, View } from 'react-native'
import { initialWindowMetrics } from 'react-native-safe-area-context'
import { withUniwind } from 'uniwind'
import { TabBarNavigationProp } from '../../navigation/rootTypes'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { useAppStorage } from '../../storage/AppStorageProvider'
import { CSAccount } from '../../storage/cloudStorage'
import { useOnboarding } from '../onboarding/OnboardingProvider'

const CheckIcon = withUniwind(Check)
const PlusIcon = withUniwind(Plus)

export type ConnectedWalletsRef = {
  show: () => void
  hide: () => void
}

type Props = {
  ref?: React.Ref<ConnectedWalletsRef>
  onClose?: () => void
  onAddNew: () => void
  onAddSub: (acc: CSAccount) => void
  children: ReactNode
}

// A testnet row or button carries a translucent testnet tint behind it.
const TestnetFill = () => (
  <View className="absolute inset-0 bg-destructive/40" />
)

// The account switcher. It wraps the root navigator, outside the content
// column, so it insets the sheet to the column itself.
const ConnectedWallets = ({
  ref,
  onClose,
  onAddNew,
  onAddSub,
  children,
}: Props) => {
  const { t } = useTranslation()
  const sheetRef = useRef<BottomSheetModal>(null)
  const sheetMargins = useContentColumnMargins()
  const [listItemHeight, setListItemHeight] = useLayoutHeight()
  const [sectionHeaderHeight, setSectionHeaderHeight] = useLayoutHeight()
  const [footerHeight, setFooterHeight] = useLayoutHeight()
  const [sectionFooterHeights, setSectionFooterHeights] = useState<{
    [key: string]: number
  }>({})
  const sectionFooterHeight = Object.values(sectionFooterHeights).reduce(
    (acc, height) => acc + height,
    0,
  )

  const { sortedAccounts, currentAccount, setCurrentAccount } =
    useAccountStorage()
  const [prevSortedAccounts, setPrevSortedAccounts] = useState(sortedAccounts)
  if (prevSortedAccounts !== sortedAccounts) {
    setPrevSortedAccounts(sortedAccounts)
    const hashes = new Set(sortedAccounts.map((a) => a.mnemonicHash || 'none'))
    setSectionFooterHeights((prev) =>
      Object.entries(prev)
        .filter(([key]) => hashes.has(key))
        .reduce((acc, [key, height]) => ({ ...acc, [key]: height }), {}),
    )
  }
  const navigation = useNavigation<TabBarNavigationProp>()
  const { enableTestnet } = useAppStorage()

  const grouped = sortedAccounts
    .filter((a) => a.netType !== NetTypes.TESTNET)
    .reduce(
      (acc, account) => {
        acc[account.mnemonicHash || 'none'] = [
          ...(acc[account.mnemonicHash || 'none'] || []),
          account,
        ]
        return acc
      },
      {} as { [key: string]: CSAccount[] },
    )
  const { none, ...rest } = grouped
  const filteredAccounts = Object.values(rest).map((accounts, index) => ({
    title: `Seed Phrase ${index + 1}`,
    data: accounts,
  }))
  if (none) {
    filteredAccounts.push({
      title: 'Private Keys',
      data: none,
    })
  }

  const totalHeight =
    listItemHeight &&
    footerHeight &&
    sectionHeaderHeight &&
    sortedAccounts.length &&
    listItemHeight * (sortedAccounts.length + (enableTestnet ? 2 : 1)) +
      footerHeight +
      sectionHeaderHeight * filteredAccounts.length +
      sectionFooterHeight
  const snapPoints = [
    totalHeight && totalHeight < 0.7 * (initialWindowMetrics?.frame.height || 0)
      ? totalHeight
      : '70%',
  ]

  const { setOnboardingData } = useOnboarding()

  const show = () => sheetRef.current?.present()
  const hide = () => sheetRef.current?.dismiss()

  useImperativeHandle(ref, () => ({ show, hide }))

  const handleNetTypeChange = (nextNetType?: NetTypes.NetType) => {
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
  }

  const handleAddNew = (netType: NetTypes.NetType) => () => {
    hide()
    handleNetTypeChange(netType)
    onAddNew()
  }

  const handleAccountChange = (item: CSAccount) => () => {
    hide()
    setCurrentAccount(item)
    // Reset Home & Collectables stack to first screen
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    })
  }

  const renderItem = ({ item }: { index: number; item: CSAccount }) => {
    const isSelected = item.address === currentAccount?.address
    return (
      <PressableScale
        feedback="opacity"
        onPress={handleAccountChange(item)}
        onLayout={setListItemHeight}
        className="flex-row items-center py-5 pl-12 pr-6"
      >
        {item.netType === NetTypes.TESTNET && <TestnetFill />}
        <AccountIcon address={item?.solanaAddress} size={25} />
        <Text
          size="xl"
          className={
            isSelected
              ? 'ml-4 font-medium'
              : 'ml-4 font-medium text-muted-foreground'
          }
        >
          {item.alias}
        </Text>
        <View className="flex-1 items-end">
          {isSelected && (
            <CheckIcon size={20} colorClassName="accent-foreground" />
          )}
        </View>
      </PressableScale>
    )
  }

  const footer = () => (
    <View onLayout={setFooterHeight} className="pb-8">
      <PressableScale
        testID="ConnectedWallets.AddNew"
        feedback="opacity"
        onPress={handleAddNew(NetTypes.MAINNET)}
        className="flex-row items-center border-t border-border px-6 py-5"
      >
        <PlusIcon size={24} colorClassName="accent-foreground" />
        <Text size="xl" className="ml-4 font-medium">
          {t('connectedWallets.add')}
        </Text>
      </PressableScale>

      {enableTestnet && (
        <PressableScale
          feedback="opacity"
          onPress={handleAddNew(NetTypes.TESTNET)}
          className="flex-row items-center border-t border-border px-6 py-5"
        >
          <TestnetFill />
          <PlusIcon size={24} colorClassName="accent-foreground" />
          <Text size="xl" className="ml-4 font-medium">
            {t('connectedWallets.addTestnet')}
          </Text>
        </PressableScale>
      )}
    </View>
  )

  const sectionFooter = ({
    section: { data },
  }: {
    section: { data: CSAccount[] }
  }) => (
    <SectionFooter
      data={data}
      onAddSub={onAddSub}
      isSelected={
        data[0] && data[0].mnemonicHash === currentAccount?.mnemonicHash
      }
      onLayout={(height) => {
        setSectionFooterHeights((prev) => {
          const newHeight = { ...prev }
          if (height.nativeEvent) {
            newHeight[data[0].mnemonicHash || 'none'] =
              height.nativeEvent.layout.height
          }

          return newHeight
        })
      }}
    />
  )

  return (
    <BottomSheetModalProvider>
      {children}
      <Sheet
        ref={sheetRef}
        style={sheetMargins}
        index={0}
        snapPoints={snapPoints}
        onDismiss={onClose}
      >
        <BottomSheetSectionList
          contentInsetAdjustmentBehavior="automatic"
          sections={filteredAccounts}
          keyExtractor={(item) => item.address}
          renderItem={renderItem}
          ListFooterComponent={footer}
          scrollEnabled
          renderSectionHeader={({ section: { title, data } }) => (
            <View
              onLayout={setSectionHeaderHeight}
              className="flex-row items-center bg-popover px-6"
            >
              <Text
                size="xl"
                className={
                  data[0] &&
                  data[0]?.mnemonicHash === currentAccount?.mnemonicHash
                    ? 'font-medium'
                    : 'font-medium text-muted-foreground'
                }
              >
                {title}
              </Text>
            </View>
          )}
          renderSectionFooter={sectionFooter}
        />
      </Sheet>
    </BottomSheetModalProvider>
  )
}

const SectionFooter = ({
  data,
  onAddSub,
  onLayout,
  isSelected,
}: {
  data: CSAccount[]
  isSelected: boolean
  onAddSub: (acc: CSAccount) => void
  onLayout: (height: LayoutChangeEvent) => void
}) => {
  const { t } = useTranslation()
  const handleAddSub = () => {
    if (data[0] && data[0].mnemonicHash) {
      onAddSub(data[data.length - 1])
    }
  }
  return (
    <View onLayout={onLayout}>
      {isSelected && data[0] && data[0].mnemonicHash ? (
        <PressableScale
          feedback="opacity"
          onPress={handleAddSub}
          className="flex-row items-center py-5 pl-12 pr-6"
        >
          <PlusIcon size={24} colorClassName="accent-foreground" />
          <Text size="xl" className="ml-4 font-medium text-muted-foreground">
            {t('connectedWallets.addSub')}
          </Text>
        </PressableScale>
      ) : null}
    </View>
  )
}

export default ConnectedWallets
