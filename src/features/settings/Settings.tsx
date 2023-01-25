import React, { memo, ReactText, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigation } from '@react-navigation/native'
import { Alert, Linking, Platform, SectionList } from 'react-native'
import { Cluster } from '@solana/web3.js'
import Text from '../../components/Text'
import SafeAreaBox from '../../components/SafeAreaBox'
import { HomeNavigationProp } from '../home/homeTypes'
import { useHitSlop, useSpacing } from '../../theme/themeHooks'
import Box from '../../components/Box'
import SettingsListItem, { SettingsListItemType } from './SettingsListItem'
import { useAppVersion } from '../../hooks/useDevice'
import { SUPPORTED_LANGUAGUES } from '../../utils/i18n'
import useAuthIntervals from './useAuthIntervals'
import SUPPORTED_CURRENCIES from '../../utils/supportedCurrencies'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { useAppStorage } from '../../storage/AppStorageProvider'
import { SettingsNavigationProp } from './settingsTypes'
import { useLanguageStorage } from '../../storage/LanguageProvider'
import useCopyText from '../../hooks/useCopyText'
import useAlert from '../../hooks/useAlert'
import {
  checkSecureAccount,
  getSecureAccount,
} from '../../storage/secureStorage'
import { useApolloClient } from '../../graphql/useApolloClient'
import { PRIVACY_POLICY, TERMS_OF_SERVICE } from '../../constants/urls'
import { ellipsizeAddress } from '../../utils/accountUtils'
import { RootNavigationProp } from '../../navigation/rootTypes'
import CloseButton from '../../components/CloseButton'
import { useGetBetaPubkeysQuery } from '../../store/slices/walletRestApi'

const Settings = () => {
  const { t } = useTranslation()
  const homeNav = useNavigation<HomeNavigationProp>()
  const settingsNav = useNavigation<SettingsNavigationProp>()
  const { client } = useApolloClient()
  const rootNav = useNavigation<RootNavigationProp>()
  const spacing = useSpacing()
  const version = useAppVersion()
  const hitSlop = useHitSlop('xxl')
  const authIntervals = useAuthIntervals()
  const {
    currentAccount,
    accounts,
    sortedTestnetAccounts,
    defaultAccountAddress,
    updateDefaultAccountAddress,
    signOut,
  } = useAccountStorage()
  const { changeLanguage, language } = useLanguageStorage()
  const {
    authInterval,
    convertToCurrency,
    currency,
    enableTestnet,
    pin: appPin,
    requirePinForPayment,
    solanaNetwork,
    updateAuthInterval,
    updateConvertToCurrency,
    updateCurrency,
    updateEnableTestnet,
    updateRequirePinForPayment,
    updateSolanaNetwork,
    l1Network,
    updateL1Network,
  } = useAppStorage()
  const copyText = useCopyText()
  const { showOKAlert, showOKCancelAlert } = useAlert()
  const { data: betaAccess } = useGetBetaPubkeysQuery()

  const isDefaultAccount = useMemo(
    () => defaultAccountAddress === currentAccount?.address,
    [currentAccount, defaultAccountAddress],
  )

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

  const handleSetDefaultAccount = useCallback(
    async (value?: boolean) => {
      if (!isDefaultAccount && value && currentAccount && accounts) {
        // toggling on
        const oldAccount = Object.values(accounts).find(
          (a) => a.address === defaultAccountAddress,
        )
        const decision = await showOKCancelAlert({
          title: t('settings.sections.defaultAccount.enableTitle'),
          message: t('settings.sections.defaultAccount.enableMessage', {
            aliasOld: oldAccount?.alias,
            aliasNew: currentAccount.alias,
          }),
        })
        if (decision) {
          await updateDefaultAccountAddress(currentAccount.address)
        }
      }

      if (isDefaultAccount && !value) {
        // toggling off
        await showOKAlert({
          title: t('settings.sections.defaultAccount.disableTitle'),
          message: t('settings.sections.defaultAccount.disableMessage'),
        })
      }
    },
    [
      accounts,
      currentAccount,
      defaultAccountAddress,
      isDefaultAccount,
      showOKAlert,
      showOKCancelAlert,
      t,
      updateDefaultAccountAddress,
    ],
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

  const handleSignOut = useCallback(async () => {
    const secureAccount = await getSecureAccount(currentAccount?.address)
    if (!secureAccount || !!currentAccount?.ledgerDevice) {
      const currentAddress = currentAccount?.address
      const savedAccountAddresses = Object.keys(accounts || {})
      const isLastAccount =
        accounts &&
        currentAddress &&
        savedAccountAddresses.length === 1 &&
        savedAccountAddresses.includes(currentAddress)
      const iCloudMessage =
        Platform.OS === 'ios'
          ? t('settings.sections.account.signOutAlert.iCloudMessage')
          : ''

      Alert.alert(
        t('settings.sections.account.signOutAlert.title', {
          alias: currentAccount?.alias,
        }),
        t(
          `settings.sections.account.signOutAlert.${
            isLastAccount ? 'bodyLastAccount' : 'body'
          }`,
          {
            alias: currentAccount?.alias,
          },
        ) + iCloudMessage,
        [
          {
            text: t('generic.cancel'),
            style: 'cancel',
          },
          {
            text: t('settings.sections.account.signOut'),
            style: 'destructive',
            onPress: async () => {
              if (isLastAccount) {
                // last account is signing out, clear all storage then nav to onboarding
                await signOut()
                client?.resetStore()
                rootNav.replace('OnboardingNavigator')
              } else {
                // sign out the specific account, then nav to home
                await signOut(currentAccount)
                homeNav.popToTop()
              }
            },
          },
        ],
      )
    } else {
      settingsNav.push('ConfirmSignout')
    }
  }, [
    accounts,
    client,
    currentAccount,
    homeNav,
    rootNav,
    settingsNav,
    signOut,
    t,
  ])

  const handleLanguageChange = useCallback(
    async (lng: string) => {
      await changeLanguage(lng)
    },
    [changeLanguage],
  )

  const handleCurrencyTypeChange = useCallback(
    async (currencyType: ReactText, _index: number) => {
      await updateCurrency(currencyType as string)
    },
    [updateCurrency],
  )

  const handleSolanaNetworkChange = useCallback(
    async (network: ReactText, _index: number) => {
      // TODO: Should we reset the solana and collectable slices when cluster changes?
      await updateSolanaNetwork(network as Cluster)
    },
    [updateSolanaNetwork],
  )

  const handleToggleEnableTestnet = useCallback(async () => {
    updateEnableTestnet(!enableTestnet)
    if (enableTestnet) {
      return
    }

    Alert.alert(
      t('settings.sections.dev.testnet.enablePrompt.title'),
      t('settings.sections.dev.testnet.enablePrompt.message'),
      [
        {
          text: t('generic.cancel'),
          style: 'destructive',
          onPress: () => updateEnableTestnet(false),
        },
        {
          text: t('generic.ok'),
          style: 'default',
        },
      ],
    )
  }, [enableTestnet, t, updateEnableTestnet])

  const handleUpdateAlias = useCallback(
    () => settingsNav.push('UpdateAlias'),
    [settingsNav],
  )

  const handleRevealWords = useCallback(async () => {
    const hasSecureAccount = await checkSecureAccount(
      currentAccount?.address,
      true,
    )
    if (!hasSecureAccount) return
    if (isPinRequired) {
      settingsNav.push('SettingsConfirmPin', {
        pin: appPin?.value || '',
        action: 'revealWords',
      })
    } else {
      settingsNav.push('RevealWords')
    }
  }, [appPin, currentAccount, isPinRequired, settingsNav])

  const handleRevealPrivateKey = useCallback(async () => {
    const hasSecureAccount = await checkSecureAccount(
      currentAccount?.address,
      true,
    )
    if (!hasSecureAccount) return
    if (isPinRequired) {
      settingsNav.push('SettingsConfirmPin', {
        pin: appPin?.value || '',
        action: 'revealPrivateKey',
      })
    } else {
      settingsNav.push('RevealPrivateKey')
    }
  }, [appPin, currentAccount, isPinRequired, settingsNav])

  const handleCopyAddress = useCallback(() => {
    if (!currentAccount?.address) return
    if (l1Network !== 'solana') {
      copyText({
        message: ellipsizeAddress(currentAccount?.address),
        copyText: currentAccount?.address,
      })
    } else {
    }
  }, [copyText, currentAccount, l1Network])

  const handleShareAddress = useCallback(() => {
    settingsNav.navigate('ShareAddress')
  }, [settingsNav])

  const SectionData = useMemo((): {
    title: string
    data: SettingsListItemType[]
  }[] => {
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

    let devData: SettingsListItemType[] = [
      {
        title: t('settings.sections.dev.testnet.title'),
        value: enableTestnet,
        onToggle: handleToggleEnableTestnet,
        disabled: !!sortedTestnetAccounts.length && enableTestnet,
        helperText:
          sortedTestnetAccounts.length && enableTestnet
            ? t('settings.sections.dev.testnet.helperText')
            : undefined,
      },
    ]

    if (betaAccess?.publicKeys?.includes(currentAccount?.address || '')) {
      devData.push({
        title: t('settings.sections.dev.solana.title'),
        value: l1Network === 'solana',
        onToggle: () =>
          updateL1Network(l1Network === 'helium' ? 'solana' : 'helium'),
        helperText: t('settings.sections.dev.solana.helperText'),
        onPress: () => {
          showOKAlert({
            message: t('settings.sections.dev.solana.prompt.message'),
            title: t('settings.sections.dev.solana.prompt.title'),
          })
        },
      })
    }

    if (l1Network === 'solana') {
      const items = [
        { label: 'Devnet', value: 'devnet' },
        { label: 'Testnet', value: 'testnet', disabled: true },
        { label: 'Mainnet-Beta', value: 'mainnet-beta', disabled: true },
      ]

      if (__DEV__) {
        // push the localnet option to the front of the list
        items.unshift({ label: 'Localnet', value: 'localnet' })
      }

      devData = [
        ...devData,
        {
          title: t('settings.sections.dev.solanaNetwork.title'),
          value: solanaNetwork,
          select: {
            items,
            onValueSelect: handleSolanaNetworkChange,
          },
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
            label: t('settings.sections.account.alias'),
            title: currentAccount?.alias || '',
            onPress: handleUpdateAlias,
          },
          {
            title: t('settings.sections.defaultAccount.title'),
            onToggle: handleSetDefaultAccount,
            value: isDefaultAccount,
          },
          {
            title: t('settings.sections.account.copyAddress'),
            onPress: l1Network === 'solana' ? undefined : handleCopyAddress,
            select:
              l1Network === 'solana'
                ? {
                    items: [
                      { label: 'Helium', value: 'helium' },
                      { label: 'Solana', value: 'solana' },
                    ],
                    onValueSelect: (val) => {
                      const address =
                        val === 'helium'
                          ? currentAccount?.address
                          : currentAccount?.solanaAddress

                      if (!address) return

                      copyText({
                        message: ellipsizeAddress(address),
                        copyText: address,
                      })
                    },
                  }
                : undefined,
          },
          {
            title: t('settings.sections.account.shareAddress'),
            onPress: handleShareAddress,
          },
          {
            title: t('settings.sections.account.signOut'),
            onPress: handleSignOut,
            destructive: true,
          },
        ],
      },
      {
        title: t('settings.sections.backup.title', {
          alias: currentAccount?.alias,
        }),
        data: [
          {
            title: t('settings.sections.backup.revealWords'),
            onPress: handleRevealWords,
          },
          {
            title: t('settings.sections.backup.revealPrivateKey'),
            onPress: handleRevealPrivateKey,
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

      {
        title: t('settings.sections.dev.title'),
        data: devData,
      },
      {
        title: t('settings.sections.finePrint.title'),
        data: [
          {
            title: t('settings.sections.finePrint.privacyPolicy'),
            onPress: () => Linking.openURL(PRIVACY_POLICY),
          },
          {
            title: t('settings.sections.finePrint.termsOfService'),
            onPress: () => Linking.openURL(TERMS_OF_SERVICE),
          },
        ],
      },
    ]
  }, [
    authInterval,
    authIntervals,
    betaAccess,
    convertToCurrency,
    copyText,
    currency,
    currentAccount,
    enableTestnet,
    handleCopyAddress,
    handleCurrencyTypeChange,
    handleIntervalSelected,
    handleLanguageChange,
    handlePinForPayment,
    handlePinRequired,
    handleResetPin,
    handleRevealPrivateKey,
    handleRevealWords,
    handleSetDefaultAccount,
    handleShareAddress,
    handleSignOut,
    handleSolanaNetworkChange,
    handleToggleEnableTestnet,
    handleUpdateAlias,
    isDefaultAccount,
    isPinRequired,
    l1Network,
    language,
    requirePinForPayment,
    showOKAlert,
    solanaNetwork,
    sortedTestnetAccounts.length,
    t,
    updateConvertToCurrency,
    updateL1Network,
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
    <SafeAreaBox backgroundColor="surfaceSecondary">
      <Box
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
        paddingHorizontal="l"
      >
        <Text variant="h1">{t('settings.title')}</Text>
        <CloseButton
          onPress={onRequestClose}
          hitSlop={hitSlop}
          paddingVertical="m"
        />
      </Box>
      <SectionList
        contentContainerStyle={contentContainer}
        sections={SectionData}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        renderSectionFooter={renderSectionFooter}
        initialNumToRender={100}
        stickySectionHeadersEnabled={false}
        // ^ Sometimes on initial page load there is a bug with SectionList
        // where it won't render all items right away. This seems to fix it.
      />
    </SafeAreaBox>
  )
}

export default memo(Settings)
