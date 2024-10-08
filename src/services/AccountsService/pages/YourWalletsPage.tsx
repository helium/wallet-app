import React, { useCallback, useMemo } from 'react'
import Text from '@components/Text'
import { useTranslation } from 'react-i18next'
import { ReAnimatedBox } from '@components/AnimatedBox'
import { FadeIn } from 'react-native-reanimated'
import Box from '@components/Box'
import { Image, SectionList } from 'react-native'
import { useAccountStorage } from '@storage/AccountStorageProvider'
import { NetTypes } from '@helium/address'
import { CSAccount } from '@storage/cloudStorage'
import TouchableContainer from '@components/TouchableContainer'
import AccountIcon from '@components/AccountIcon'
import { ellipsizeAddress } from '@utils/accountUtils'
import { useColors, useSpacing } from '@theme/themeHooks'
import SmallAdd from '@assets/images/smallAdd.svg'
import BigAdd from '@assets/images/bigAdd.svg'
import BigClose from '@assets/images/bigClose.svg'
import Checkmark from '@assets/images/checkmark.svg'
import { useNavigation } from '@react-navigation/native'
import {
  HELIUM_DERIVATION,
  keypairFromSeed,
  solanaDerivation,
} from '@hooks/useDerivationAccounts'
import { getSecureAccount } from '@storage/secureStorage'
import * as bip39 from 'bip39'
import { useOnboarding } from '@features/onboarding/OnboardingProvider'
import Toast from 'react-native-simple-toast'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import useLayoutHeight from '@hooks/useLayoutHeight'
import { AccountsServiceNavigationProp } from '../accountServiceTypes'

const YourWalletsPage = () => {
  const { t } = useTranslation()
  const spacing = useSpacing()
  const { setOnboardingData, onboardingData } = useOnboarding()
  const colors = useColors()
  const navigation = useNavigation<AccountsServiceNavigationProp>()
  const { sortedAccounts, currentAccount, setCurrentAccount, accounts } =
    useAccountStorage()
  const { bottom } = useSafeAreaInsets()
  const [footerHeight, setFooterHeight] = useLayoutHeight()

  const handleAddSub = useCallback(
    async (acc: CSAccount) => {
      try {
        if (!currentAccount) {
          throw new Error('No current account')
        }
        const storage = await getSecureAccount(currentAccount.address)
        const seed = bip39.mnemonicToSeedSync(
          storage?.mnemonic?.join(' ') || '',
          '',
        )

        if (!seed || !acc?.derivationPath) {
          throw new Error('Missing seed or derivation path')
        }
        const currentPath = acc.derivationPath
        const takenAddresses = new Set(
          Object.values(accounts || {}).map((a) => a.solanaAddress),
        )
        let currentAccountNum =
          currentPath === HELIUM_DERIVATION
            ? 0
            : Number(currentPath.split('/')[3].replace("'", '')) + 1
        let derivationPath = solanaDerivation(currentAccountNum, 0)
        let keypair = await keypairFromSeed(seed, derivationPath)
        while (
          currentAccountNum < 100 &&
          (!keypair || takenAddresses.has(keypair.publicKey.toBase58()))
        ) {
          currentAccountNum += 1
          derivationPath = solanaDerivation(currentAccountNum, 0)
          keypair = await keypairFromSeed(seed, derivationPath)
        }
        if (currentAccountNum >= 100) {
          throw new Error('More than 100 accounts are not supported')
        }
        if (keypair) {
          const words = (await getSecureAccount(acc.address))?.mnemonic
          setOnboardingData({
            ...onboardingData,
            words,
            paths: [
              {
                derivationPath,
                keypair,
              },
            ],
          })
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          navigation.navigate('AccountAssignScreen', {
            words,
          })
          // connectedWalletsRef.current?.hide()
        }
      } catch (e: any) {
        Toast.show(e.message || e.toString())
      }
    },
    [navigation, currentAccount, accounts, onboardingData, setOnboardingData],
  )

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
    const ret = Object.values(rest).map((accs, index) => ({
      title: `Seed Phrase ${index + 1}`,
      data: accs,
    }))
    if (none) {
      ret.push({
        title: 'Private Keys',
        data: none,
      })
    }

    return ret
  }, [sortedAccounts])

  const Header = useCallback(() => {
    return (
      <Box padding="4" alignItems="center">
        <Image
          source={require('@assets/images/accounts.png')}
          width={210.38}
          height={159.29}
        />
        <Text
          variant="displayMdSemibold"
          color="primaryText"
          textAlign="center"
        >
          {t('accountsService.title')}
        </Text>
      </Box>
    )
  }, [t])

  const keyExtractor = useCallback((item) => item.address, [])

  const handleAccountChange = useCallback(
    (item: CSAccount) => () => {
      setCurrentAccount(item)
    },
    [setCurrentAccount],
  )

  const renderItem = useCallback(
    ({
      item,
      index,
      section,
    }: {
      // eslint-disable-next-line react/no-unused-prop-types
      index: number
      // eslint-disable-next-line react/no-unused-prop-types
      item: CSAccount
      // eslint-disable-next-line react/no-unused-prop-types
      section: {
        title: string
        data: CSAccount[]
      }
    }) => {
      const { data } = section

      const isSelected = item.address === currentAccount?.address
      const mnemoicSelected =
        data[0] && data[0].mnemonicHash === currentAccount?.mnemonicHash
      const isLast = index === data.length - 1
      const accountAddress = item?.solanaAddress
      const borderTopStartRadius = index === 0 ? '2xl' : undefined
      const borderTopEndRadius = index === 0 ? '2xl' : undefined
      const borderBottomStartRadius =
        index === data.length - 1 && !mnemoicSelected ? '2xl' : undefined
      const borderBottomEndRadius =
        index === data.length - 1 && !mnemoicSelected ? '2xl' : undefined

      return (
        <TouchableContainer
          onPress={handleAccountChange(item)}
          backgroundColorPressed="bg.primary-hover"
          flexDirection="row"
          alignItems="center"
          gap="2.5"
          backgroundColor="cardBackground"
          padding="xl"
          borderTopStartRadius={borderTopStartRadius}
          borderTopEndRadius={borderTopEndRadius}
          borderBottomStartRadius={borderBottomStartRadius}
          borderBottomEndRadius={borderBottomEndRadius}
          marginBottom={!isLast ? '0.5' : '0'}
        >
          <AccountIcon address={accountAddress} size={25} />
          <Box flex={1}>
            <Text variant="textLgSemibold" color="primaryText">
              {item.alias}
            </Text>
            <Text variant="textSmRegular" color="primaryText" opacity={0.4}>
              {ellipsizeAddress(item.address, {
                numChars: 4,
              })}
            </Text>
          </Box>
          {isSelected && (
            <Checkmark color={colors.primaryText} height={20} width={20} />
          )}
        </TouchableContainer>
      )
    },
    [currentAccount?.address, handleAccountChange, colors],
  )

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

  const handleAddNew = useCallback(() => {
    handleNetTypeChange(NetTypes.MAINNET)
    navigation.navigate('AddNewAccountNavigator')
  }, [handleNetTypeChange, handleAddSub, navigation])

  const renderSectionHeader = useCallback(
    ({ section: { title, data } }) => {
      const firstSection = filteredAccounts[0].title === title

      return (
        <Box
          flexDirection="row"
          alignItems="center"
          marginBottom="2"
          marginTop={firstSection ? '0' : '5'}
        >
          <Text
            variant="textXlMedium"
            color={
              data[0] && data[0]?.mnemonicHash === currentAccount?.mnemonicHash
                ? 'primaryText'
                : 'secondaryText'
            }
          >
            {title}
          </Text>
        </Box>
      )
    },
    [filteredAccounts, currentAccount],
  )

  const renderSectionFooter = useCallback(
    ({ section: { data } }) => {
      return (
        <SectionFooter
          data={data}
          onAddSub={handleAddSub}
          isSelected={
            data[0] && data[0].mnemonicHash === currentAccount?.mnemonicHash
          }
        />
      )
    },
    [handleAddSub, currentAccount?.mnemonicHash],
  )

  const Footer = useCallback(() => {
    return (
      <Box
        flexDirection="row"
        paddingHorizontal="5"
        position="absolute"
        bottom={bottom}
        left={0}
        right={0}
        onLayout={setFooterHeight}
      >
        <TouchableOpacityBox>
          <BigClose />
        </TouchableOpacityBox>
        <Box flex={1} />
        <TouchableOpacityBox onPress={handleAddNew}>
          <BigAdd />
        </TouchableOpacityBox>
      </Box>
    )
  }, [bottom, handleAddNew, setFooterHeight])

  return (
    <ReAnimatedBox entering={FadeIn} flex={1}>
      <SectionList
        contentContainerStyle={{
          padding: spacing['2xl'],
          paddingBottom: footerHeight + bottom + spacing['6xl'],
        }}
        keyExtractor={keyExtractor}
        sections={filteredAccounts}
        ListHeaderComponent={Header}
        scrollEnabled
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        renderSectionFooter={renderSectionFooter}
      />
      <Footer />
    </ReAnimatedBox>
  )
}

const SectionFooter: React.FC<{
  data: CSAccount[]
  isSelected: boolean
  onAddSub: (acc: CSAccount) => void
}> = ({ data, onAddSub, isSelected }) => {
  const handleAddSub = useCallback(() => {
    if (data[0] && data[0].mnemonicHash) {
      onAddSub(data[data.length - 1])
    }
  }, [data, onAddSub])
  const { t } = useTranslation()
  return (
    <Box>
      {isSelected && data[0] && data[0].mnemonicHash ? (
        <TouchableContainer
          onPress={handleAddSub}
          flexDirection="row"
          alignItems="center"
          marginTop="0.5"
          backgroundColorPressed="bg.primary-hover"
          borderBottomEndRadius="2xl"
          borderBottomStartRadius="2xl"
          padding="xl"
        >
          <Text variant="textMdSemibold" color="secondaryText" flex={1}>
            {t('connectedWallets.addSub')}
          </Text>
          <SmallAdd />
        </TouchableContainer>
      ) : null}
    </Box>
  )
}

export default YourWalletsPage
