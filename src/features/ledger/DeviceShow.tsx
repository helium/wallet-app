import React, { useCallback, useState, useEffect, useEffectEvent } from 'react'
import { Image, SectionList, View } from 'react-native'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import { ChevronRight } from 'lucide-react-native'
import { withUniwind } from 'uniwind'
import Ledger from '@assets/images/ledger.svg'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { Button } from '@ui/Button'
import { Spinner } from '@ui/Spinner'
import { Text } from '@ui/Text'
import { BackButton } from '@ui/BackButton'
import { CSAccountVersion, CSAccounts } from '@storage/cloudStorage'
import useLedger, { LedgerAccount } from '@hooks/useLedger'
import {
  LedgerNavigatorNavigationProp,
  LedgerNavigatorStackParamList,
} from './ledgerNavigatorTypes'
import {
  useAccountStorage,
  MAX_ACCOUNTS,
} from '../../storage/AccountStorageProvider'
import LedgerAccountListItem, { Section } from './LedgerAccountListItem'
import { HomeNavigationProp } from '../home/homeTypes'

const ChevronRightIcon = withUniwind(ChevronRight)
const LedgerIcon = withUniwind(Ledger)

type Route = RouteProp<LedgerNavigatorStackParamList, 'DeviceShow'>

type SectionData = {
  section: {
    title: string
    index: number
  }
}
const DeviceShow = () => {
  const homeNav = useNavigation<HomeNavigationProp>()
  const navigation = useNavigation<LedgerNavigatorNavigationProp>()
  const route = useRoute<Route>()
  const { ledgerDevice } = route.params
  const { t } = useTranslation()
  const { accounts, upsertAccounts } = useAccountStorage()
  const {
    updateLedgerAccounts,
    ledgerAccounts,
    ledgerAccountsLoading: isScanning,
  } = useLedger()
  const accountAddresses = Object.keys(accounts || {})
  const existingLedgerAccounts = ledgerAccounts.filter((a) =>
    accountAddresses.includes(a.address),
  )
  const newLedgerAccounts = ledgerAccounts.filter(
    (a) => !accountAddresses.includes(a.address),
  )
  const [selectAll, setSelectAll] = useState<boolean>(false)
  const [selectedAccounts, setSelectedAccounts] = useState<
    Record<string, boolean>
  >({})

  const accountsToAdd = newLedgerAccounts.filter(
    (a) => selectedAccounts[a.address],
  )

  const [prevLedgerAccounts, setPrevLedgerAccounts] = useState(ledgerAccounts)
  if (prevLedgerAccounts !== ledgerAccounts) {
    setPrevLedgerAccounts(ledgerAccounts)
    const selected = {} as Record<string, boolean>
    ledgerAccounts.forEach((a) => {
      if (selected[a.address] === undefined) {
        selected[a.address] = false
      }
    })

    setSelectedAccounts(selected)
  }

  const { length: accountCount } = Object.keys(accounts as CSAccounts)
  const reachedAccountLimit = accountCount + accountsToAdd.length > MAX_ACCOUNTS

  const canAddAccounts = !reachedAccountLimit && accountsToAdd.length

  const SectionData: {
    title: string
    index: number
    data: LedgerAccount[]
  }[] = [
    {
      title: t('ledger.show.addNewAccount'),
      index: Section.NEW_ACCOUNT,
      data: newLedgerAccounts,
    },
  ]
  if (existingLedgerAccounts?.length > 0) {
    SectionData.push({
      title: t('ledger.show.accountsAlreadyLinked', {
        count: existingLedgerAccounts.length,
      }),
      index: Section.ALREADY_LINKED,
      data: existingLedgerAccounts,
    })
  }

  const keyExtractor = (item: { address: string }, index: number) =>
    item.address + index

  const onSelectAll = () => {
    setSelectAll((s) => {
      const next = !s

      const selected = {} as Record<string, boolean>
      ledgerAccounts.forEach((a) => {
        selected[a.address] = next
      })
      setSelectedAccounts(selected)

      return next
    })
  }

  // Show page header on first section of section list
  const renderPageHeader = () => {
    return (
      <>
        <BackButton className="m-2 my-4 px-4" onPress={navigation.goBack} />
        <View className="mb-8 flex-row items-center justify-center">
          <LedgerIcon
            width={62}
            height={62}
            colorClassName="accent-foreground"
          />
          <View className="mx-4">
            <ChevronRightIcon colorClassName="accent-foreground" />
          </View>
          <Image source={require('@assets/images/fingerprintGreen.png')} />
        </View>
        <Text size="3xl" className="text-center">
          {t('ledger.show.title')}
        </Text>
        <Text
          size="xl"
          className="mt-6 text-center font-medium text-success-500"
        >
          {t('ledger.show.subtitle')}
        </Text>
        {reachedAccountLimit && (
          <Text
            size="base"
            className="mt-4 text-center font-medium text-destructive"
          >
            {t('accountImport.accountLimitLedger')}
          </Text>
        )}
        {isScanning && (
          <View className="my-6 bg-background">
            <Text size="base" className="mb-4 text-center">
              {t('ledger.show.scanning')}
            </Text>
            <Spinner />
          </View>
        )}
      </>
    )
  }

  const renderSectionHeader = ({ section: { title, index } }: SectionData) => (
    <View className="bg-background">
      {index === 0 && renderPageHeader()}
      <View className="mx-2 flex-row items-center px-6 pb-4 pt-8">
        <Text className="grow font-bold">{title}</Text>

        {index === 0 && (
          <TouchableOpacity onPress={onSelectAll}>
            <Text className="font-bold">
              {selectAll
                ? t('ledger.show.deselectAll')
                : t('ledger.show.selectAll')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )

  const renderSectionFooter = ({ section: { index } }: SectionData) => {
    if (isScanning || ledgerAccounts.length === 0) return null
    return (
      <View className="bg-background">
        {index === 0 && newLedgerAccounts?.length === 0 && (
          <Text size="base" className="px-8 text-left text-muted-foreground">
            {t('ledger.show.emptyAccount', {
              account:
                existingLedgerAccounts[existingLedgerAccounts.length - 1]
                  ?.alias,
            })}
          </Text>
        )}
      </View>
    )
  }

  const loadLedgerAccounts = useEffectEvent(async () => {
    try {
      await updateLedgerAccounts(ledgerDevice)
    } catch (error) {
      // in this case, user is likely not on Helium app

      console.error(error)
      navigation.navigate(
        'DeviceScan',
        { error: error as Error },
        { pop: true },
      )
    }
  })
  useEffect(() => {
    loadLedgerAccounts().catch((e) => console.error(e))
  }, [])

  const handleNext = async () => {
    if (!accountsToAdd) return
    const accs = accountsToAdd?.map((acc) => {
      return {
        alias: acc.alias,
        address: acc.address,
        ledgerDevice,
        ledgerIndex: acc.accountIndex,
        solanaAddress: acc.solanaAddress,
        derivationPath: acc.derivationPath,
        version: 'v1' as CSAccountVersion,
      }
    })

    await upsertAccounts(accs)

    navigation.navigate('PairSuccess')
  }

  const handleClose = () => {
    homeNav.navigate('AccountsScreen', undefined, { pop: true })
  }

  const onCheckboxToggled = useCallback(
    (account: LedgerAccount, value: boolean) => {
      setSelectedAccounts((selected) => {
        return { ...selected, [account.address]: value }
      })
    },
    [setSelectedAccounts],
  )

  const renderItem = useCallback(
    (vals: {
      item: LedgerAccount
      index: number
      section: { title: string; index: number; data: LedgerAccount[] }
    }) => (
      <LedgerAccountListItem
        {...vals}
        isSelected={selectedAccounts[vals.item.address]}
        onCheckboxToggled={onCheckboxToggled}
      />
    ),
    [selectedAccounts, onCheckboxToggled],
  )

  if (!ledgerAccounts) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Spinner />
      </View>
    )
  }

  return (
    <View className="flex-1 bg-background">
      <View className="h-[89%]">
        <SectionList
          contentInsetAdjustmentBehavior="automatic"
          stickySectionHeadersEnabled={false}
          contentContainerClassName="pb-8"
          sections={SectionData}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          renderSectionFooter={renderSectionFooter}
          initialNumToRender={100}
        />
      </View>
      <View className="absolute inset-x-0 bottom-0 h-[11%] border-t border-border bg-background">
        <Button
          variant="secondary"
          size="lg"
          className="mx-6 mb-1 mt-4"
          onPress={canAddAccounts ? handleNext : handleClose}
        >
          {canAddAccounts ? t('ledger.show.next') : t('ledger.show.close')}
        </Button>
      </View>
    </View>
  )
}

export default DeviceShow
