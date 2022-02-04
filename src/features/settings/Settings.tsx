import React, { memo, ReactText, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigation } from '@react-navigation/native'
import Close from '@assets/images/close.svg'
import { Alert, SectionList } from 'react-native'
import Text from '../../components/Text'
import SafeAreaBox from '../../components/SafeAreaBox'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import { HomeNavigationProp } from '../home/homeTypes'
import { useColors, useSpacing } from '../../theme/themeHooks'
import Box from '../../components/Box'
import SettingsListItem, { SettingsListItemType } from './SettingsListItem'
import { useAppVersion } from '../../utils/useDevice'
import { SUPPORTED_LANGUAGUES } from '../../utils/i18n'
import useAuthIntervals from './useAuthIntervals'
import { SUPPORTED_CURRENCIES } from '../../utils/useCurrency'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { useAppStorage } from '../../storage/AppStorageProvider'
import { SettingsNavigationProp } from './settingsTypes'
import { useLanguageStorage } from '../../storage/LanguageProvider'

const Settings = () => {
  const { t } = useTranslation()
  const homeNav = useNavigation<HomeNavigationProp>()
  const settingsNav = useNavigation<SettingsNavigationProp>()
  const { primaryText } = useColors()
  const spacing = useSpacing()
  const version = useAppVersion()
  const authIntervals = useAuthIntervals()
  const { currentAccount, signOut, accounts } = useAccountStorage()
  const { changeLanguage, language } = useLanguageStorage()
  const {
    pin: appPin,
    requirePinForPayment,
    updateRequirePinForPayment,
    authInterval,
    updateAuthInterval,
    currency,
    updateCurrency,
    convertToCurrency,
    updateConvertToCurrency,
  } = useAppStorage()

  const isPinRequired = useMemo(
    () => appPin !== undefined && appPin.status !== 'off',
    [appPin],
  )

  const onRequestClose = useCallback(() => {
    homeNav.navigate('AccountsScreen')
  }, [homeNav])

  const contentContainer = useMemo(
    () => ({
      paddingBottom: spacing.xxxl,
    }),
    [spacing.xxxl],
  )

  const keyExtractor = useCallback((item, index) => item.title + index, [])

  const renderSectionFooter = useCallback(
    ({ section: { footer } }) => footer,
    [],
  )

  const handleIntervalSelected = useCallback(
    async (value: ReactText) => {
      const number = typeof value === 'number' ? value : parseInt(value, 10)
      await updateAuthInterval(number)
    },
    [updateAuthInterval],
  )

  const handleResetPin = useCallback(() => {
    settingsNav.push('SettingsConfirmPin', {
      pin: appPin?.value || '',
      action: 'reset',
    })
  }, [settingsNav, appPin])

  const handlePinRequired = useCallback(
    async (value?: boolean) => {
      if (!isPinRequired && value) {
        // toggling on
        settingsNav.push('SettingsCreatePin')
      }

      if (isPinRequired && !value) {
        // toggling off, confirm pin before turning off
        settingsNav.push('SettingsConfirmPin', {
          pin: appPin?.value || '',
          action: 'remove',
        })
      }
    },
    [settingsNav, appPin, isPinRequired],
  )

  const handlePinForPayment = useCallback(
    async (value?: boolean) => {
      if (!requirePinForPayment && value) {
        // toggling on
        await updateRequirePinForPayment(value)
      }

      if (requirePinForPayment && !value) {
        // toggling off, confirm pin before turning off
        settingsNav.push('SettingsConfirmPin', {
          pin: appPin?.value || '',
          action: 'disablePaymentPin',
        })
      }
    },
    [requirePinForPayment, updateRequirePinForPayment, settingsNav, appPin],
  )

  const handleSignOut = useCallback(() => {
    Alert.alert(
      t('settings.sections.account.signOutAlert.title', {
        alias: currentAccount?.alias,
      }),
      t('settings.sections.account.signOutAlert.body', {
        alias: currentAccount?.alias,
      }),
      [
        {
          text: t('generic.cancel'),
          style: 'cancel',
        },
        {
          text: t('settings.sections.account.signOut'),
          style: 'destructive',
          onPress: async () => {
            const currentAddress = currentAccount?.address
            const savedAccountAddresses = Object.keys(accounts || {})
            if (
              accounts &&
              currentAddress &&
              savedAccountAddresses.length === 1 &&
              savedAccountAddresses.includes(currentAddress)
            ) {
              // last account is signing out, clear all storage then nav to onboarding
              await signOut()
            } else {
              // sign out the specific account, then nav to home
              await signOut(currentAccount?.address)
              homeNav.popToTop()
            }
          },
        },
      ],
    )
  }, [t, currentAccount, accounts, signOut, homeNav])

  const handleLanguageChange = useCallback(
    async (lng: string) => {
      await changeLanguage(lng)
    },
    [changeLanguage],
  )

  const handleCurrencyTypeChange = useCallback(
    async (currencyType: string) => {
      await updateCurrency(currencyType)
    },
    [updateCurrency],
  )

  const handleUpdateAlias = useCallback(
    () => settingsNav.push('UpdateAlias'),
    [settingsNav],
  )

  const handleRevealWords = useCallback(() => {
    if (isPinRequired) {
      settingsNav.push('SettingsConfirmPin', {
        pin: appPin?.value || '',
        action: 'revealWords',
      })
    } else {
      settingsNav.push('RevealWords')
    }
  }, [appPin, isPinRequired, settingsNav])

  const SectionData = useMemo(() => {
    let pin: SettingsListItemType[] = [
      {
        title: t('settings.sections.security.enablePin'),
        onToggle: handlePinRequired,
        value: isPinRequired,
      },
    ]

    if (isPinRequired) {
      pin = [
        ...pin,
        {
          title: t('settings.sections.security.requirePin'),
          value: authInterval,
          select: {
            items: authIntervals,
            onValueSelect: handleIntervalSelected,
          },
        },
        {
          title: t('settings.sections.security.resetPin'),
          onPress: handleResetPin,
        },
        {
          title: t('settings.sections.security.requirePinForPayments'),
          onToggle: handlePinForPayment,
          value: requirePinForPayment,
        },
      ]
    }
    return [
      {
        title: t('settings.sections.account.title', {
          alias: currentAccount?.alias,
        }),
        data: [
          {
            subtitle: t('settings.sections.account.alias'),
            title: currentAccount?.alias || '',
            onPress: handleUpdateAlias,
          },
          {
            title: t('settings.sections.account.revealWords'),
            onPress: handleRevealWords,
          },
          {
            title: t('settings.sections.account.signOut'),
            onPress: handleSignOut,
            destructive: true,
          },
        ],
      },
      {
        title: t('settings.sections.security.title'),
        data: pin,
      },
      {
        title: t('settings.sections.app.title'),
        data: [
          {
            title: t('settings.sections.app.language'),
            value: language,
            select: {
              items: SUPPORTED_LANGUAGUES,
              onValueSelect: handleLanguageChange,
            },
          },
          {
            title: t('settings.sections.app.currency'),
            value: currency,
            select: {
              items: Object.keys(SUPPORTED_CURRENCIES).map((p) => {
                return {
                  label: `${p} ${SUPPORTED_CURRENCIES[p]}`,
                  labelShort: p,
                  value: p,
                }
              }),
              onValueSelect: handleCurrencyTypeChange,
            },
          },
          {
            title: t('settings.sections.app.convertHntToCurrency'),
            value: convertToCurrency,
            onToggle: updateConvertToCurrency,
          },
          {
            title: t('settings.sections.app.version'),
            staticText: true,
            value: version.toString(),
          },
        ] as SettingsListItemType[],
      },
    ]
  }, [
    authInterval,
    authIntervals,
    convertToCurrency,
    currency,
    currentAccount,
    handleCurrencyTypeChange,
    handleIntervalSelected,
    handleLanguageChange,
    handlePinForPayment,
    handlePinRequired,
    handleResetPin,
    handleRevealWords,
    handleSignOut,
    handleUpdateAlias,
    isPinRequired,
    language,
    requirePinForPayment,
    t,
    updateConvertToCurrency,
    version,
  ])

  const renderItem = useCallback(
    ({ item, index }) => <SettingsListItem item={item} isTop={index === 0} />,
    [],
  )

  const renderSectionHeader = useCallback(
    ({ section: { title, icon } }) => (
      <Box
        flexDirection="row"
        alignItems="center"
        paddingTop="xxl"
        paddingBottom="m"
        paddingHorizontal="l"
        backgroundColor="primaryBackground"
      >
        {icon !== undefined && icon}
        <Text variant="body2" fontWeight="bold">
          {title}
        </Text>
      </Box>
    ),
    [],
  )

  return (
    <SafeAreaBox>
      <Box
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
        paddingHorizontal="l"
        paddingTop="s"
      >
        <Text variant="h1">{t('settings.title')}</Text>
        <TouchableOpacityBox onPress={onRequestClose}>
          <Close color={primaryText} height={16} width={16} />
        </TouchableOpacityBox>
      </Box>
      <SectionList
        contentContainerStyle={contentContainer}
        sections={SectionData}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        renderSectionFooter={renderSectionFooter}
        initialNumToRender={100}
        // ^ Sometimes on initial page load there is a bug with SectionList
        // where it won't render all items right away. This seems to fix it.
      />
    </SafeAreaBox>
  )
}

export default memo(Settings)
