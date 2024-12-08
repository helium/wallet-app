import React, { useCallback, useState, useMemo, useEffect } from 'react'
import { RefreshControl, SectionList } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useAsync } from 'react-async-hook'
import Ledger from '@assets/svgs/ledger.svg'
import { TouchableOpacity } from 'react-native-gesture-handler'
import Box from '@components/Box'
import Text from '@components/Text'
import { useColors, useSpacing } from '@config/theme/themeHooks'
import { CSAccountVersion, CSAccounts } from '@config/storage/cloudStorage'
import useLedger, { LedgerAccount } from '@hooks/useLedger'
import {
  useAccountStorage,
  MAX_ACCOUNTS,
} from '@config/storage/AccountStorageProvider'
import { useOnboarding } from '@features/onboarding/OnboardingProvider'
import ScrollBox from '@components/ScrollBox'
import { useOnboardingSheet } from '@features/onboarding/OnboardingSheet'
import CheckButton from '@components/CheckButton'
import LedgerAccountListItem, { Section } from './LedgerAccountListItem'

type SectionData = {
  section: {
    title: string
    index: number
  }
}
const DeviceShow = () => {
  const { onboardingData } = useOnboarding()
  const ledgerDevice = useMemo(
    () => onboardingData?.ledgerDevice,
    [onboardingData],
  )
  const { t } = useTranslation()
  const { accounts, upsertAccounts } = useAccountStorage()
  const {
    updateLedgerAccounts,
    ledgerAccounts,
    ledgerAccountsLoading: isScanning,
  } = useLedger()
  const [newLedgerAccounts, setNewLedgerAccounts] = useState<LedgerAccount[]>(
    [],
  )
  const [existingLedgerAccounts, setExistingLedgerAccounts] = useState<
    LedgerAccount[]
  >([])
  const [selectAll, setSelectAll] = useState<boolean>(true)
  const [selectedAccounts, setSelectedAccounts] = useState<
    Record<string, boolean>
  >({})

  const { carouselRef } = useOnboardingSheet()
  const spacing = useSpacing()
  const colors = useColors()
  const accountsToAdd = useMemo(
    () => newLedgerAccounts.filter((a) => selectedAccounts[a.address]),

    [newLedgerAccounts, selectedAccounts],
  )

  useEffect(() => {
    const selected = {} as Record<string, boolean>
    ledgerAccounts.forEach((a) => {
      if (selected[a.address] === undefined) {
        selected[a.address] = true
      }
    })

    setSelectedAccounts(selected)
  }, [ledgerAccounts])

  const reachedAccountLimit = useMemo(() => {
    const { length } = Object.keys(accounts as CSAccounts)

    const selectedCount = Object.keys(selectedAccounts).filter(
      (key) => !!selectedAccounts[key],
    ).length

    return length + selectedCount > MAX_ACCOUNTS
  }, [accounts, selectedAccounts])

  const SectionData = useMemo((): {
    title: string
    index: number
    data: LedgerAccount[]
  }[] => {
    const sections = [
      {
        title: t('ledger.show.addNewAccount'),
        index: Section.NEW_ACCOUNT,
        data: newLedgerAccounts,
      },
    ]

    if (existingLedgerAccounts?.length > 0) {
      sections.push({
        title: t('ledger.show.accountsAlreadyLinked', {
          count: existingLedgerAccounts.length,
        }),
        index: Section.ALREADY_LINKED,
        data: existingLedgerAccounts,
      })
    }
    return sections
  }, [newLedgerAccounts, existingLedgerAccounts, t])

  const contentContainer = useMemo(
    () => ({
      padding: spacing['2xl'],
    }),
    [spacing],
  )

  const keyExtractor = useCallback(
    (item: { address: string }, index: number) => item.address + index,
    [],
  )

  const onSelectAll = useCallback(() => {
    setSelectAll((s) => {
      const next = !s

      const selected = {} as Record<string, boolean>
      ledgerAccounts.forEach((a) => {
        selected[a.address] = next
      })
      setSelectedAccounts(selected)

      return next
    })
  }, [ledgerAccounts])

  // Show page header on first section of section list
  const PageHeader = useCallback(() => {
    return (
      <>
        <Box
          marginTop="2xl"
          marginBottom="8"
          flexDirection="row"
          justifyContent="center"
          alignItems="center"
        >
          <Ledger width={62} height={62} color={colors.primaryText} />
        </Box>
        <Text variant="displayMdSemibold" textAlign="center">
          {t('ledger.show.title')}
        </Text>
        <Text
          variant="textXlRegular"
          color="text.quaternary-500"
          marginTop="6"
          textAlign="center"
        >
          {t('ledger.show.subtitle')}
        </Text>
        <Text
          visible={reachedAccountLimit}
          variant="textMdRegular"
          textAlign="center"
          color="error.500"
          fontWeight="500"
          marginTop="4"
        >
          {t('accountImport.accountLimitLedger')}
        </Text>
      </>
    )
  }, [colors, reachedAccountLimit, t])

  const renderSectionHeader = useCallback(
    ({ section: { index } }: SectionData) => (
      <Box>
        {index === 0 && PageHeader()}
        <Box
          flexDirection="row"
          alignItems="center"
          paddingTop="8"
          paddingBottom="4"
        >
          {index === 0 && (
            <TouchableOpacity onPress={onSelectAll}>
              <Text variant="textSmRegular" fontWeight="bold">
                {selectAll
                  ? t('ledger.show.deselectAll')
                  : t('ledger.show.selectAll')}
              </Text>
            </TouchableOpacity>
          )}
        </Box>
      </Box>
    ),
    [PageHeader, onSelectAll, selectAll, t],
  )

  const renderSectionFooter = useCallback(
    ({ section: { index } }: SectionData) => {
      if (isScanning || ledgerAccounts.length === 0) return null
      return (
        <Box backgroundColor="primaryBackground">
          {index === 0 && newLedgerAccounts?.length === 0 && (
            <Text
              paddingHorizontal="8"
              variant="textMdRegular"
              color="gray.500"
              textAlign="left"
            >
              {t('ledger.show.emptyAccount', {
                account:
                  existingLedgerAccounts[existingLedgerAccounts.length - 1]
                    ?.alias,
              })}
            </Text>
          )}
        </Box>
      )
    },
    [existingLedgerAccounts, isScanning, ledgerAccounts, newLedgerAccounts, t],
  )

  const { execute: scanLedger } = useAsync(async () => {
    if (!ledgerDevice) return
    try {
      await updateLedgerAccounts(ledgerDevice)
    } catch (error) {
      // in this case, user is likely not on Helium app

      console.error(error)
      carouselRef?.current?.snapToPrev()
    }
  }, [ledgerDevice, carouselRef])

  useEffect(() => {
    const accountAddresses = Object.keys(accounts || {})

    setExistingLedgerAccounts([
      ...ledgerAccounts.filter((a) => accountAddresses.includes(a.address)),
    ])

    setNewLedgerAccounts([
      ...ledgerAccounts.filter((a) => !accountAddresses.includes(a.address)),
    ])
  }, [accounts, ledgerAccounts, selectedAccounts])

  const handleNext = useCallback(async () => {
    if (!accountsToAdd) return
    const accs = accountsToAdd?.map((acc) => {
      return {
        alias: acc.alias,
        address: acc.address,
        ledgerDevice,
        ledgerIndex: acc.accountIndex,
        solanaAddress: acc.solanaAddress,
        version: 'v1' as CSAccountVersion,
      }
    })

    await upsertAccounts(accs)

    carouselRef?.current?.snapToNext()
  }, [accountsToAdd, carouselRef, ledgerDevice, upsertAccounts])

  const onCheckboxToggled = useCallback(
    (account: LedgerAccount, value: boolean) => {
      setSelectedAccounts((selected) => {
        return { ...selected, [account.address]: value }
      })
    },
    [],
  )

  return (
    <>
      <ScrollBox
        flex={1}
        contentContainerStyle={contentContainer}
        refreshControl={
          <RefreshControl
            enabled
            refreshing={isScanning}
            onRefresh={scanLedger}
            title=""
            tintColor={colors.primaryText}
          />
        }
      >
        <SectionList
          stickySectionHeadersEnabled={false}
          sections={SectionData}
          keyExtractor={keyExtractor}
          renderItem={(vals) => (
            <LedgerAccountListItem
              {...vals}
              isSelected={selectedAccounts[vals.item.address]}
              onCheckboxToggled={onCheckboxToggled}
            />
          )}
          renderSectionHeader={renderSectionHeader}
          renderSectionFooter={renderSectionFooter}
          initialNumToRender={100}
        />
      </ScrollBox>
      <CheckButton onPress={handleNext} />
    </>
  )
}

export default DeviceShow
