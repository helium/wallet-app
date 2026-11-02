import React, { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { withUniwind } from 'uniwind'
import Crowdspot from '@assets/images/crowdspot.svg'
import AddDapp from '@assets/images/addDapp.svg'
import DappEllipsis from '@assets/images/dapp-ellipsis.svg'
import { NetTypes as NetType, NetTypes } from '@helium/address'
import { AccountButton } from '@ui/AccountButton'
import { AccountSelector, type AccountSelectorRef } from '@ui/AccountSelector'
import { useAccountStorage } from '@storage/AccountStorageProvider'
import { AccountIcon } from '@ui/AccountIcon'
import { Button } from '@ui/Button'
import { Spinner } from '@ui/Spinner'
import { Text } from '@ui/Text'

const AddDappArt = withUniwind(AddDapp)

type Props = {
  onLogin: () => void
  appName: string
  onCancel: () => void
  loading: boolean
}
const DappLogin = ({ onLogin, onCancel, appName, loading }: Props) => {
  const {
    currentAccount,
    setCurrentAccount,
    sortedMainnetAccounts,
    currentNetworkAddress,
  } = useAccountStorage()
  const { t } = useTranslation()
  const accountSelectorRef = useRef<AccountSelectorRef>(null)

  const isCrowdspot = appName.toLowerCase() === 'crowdspot'

  const handleAccountButtonPress = () => {
    if (!accountSelectorRef?.current) return

    accountSelectorRef.current.showAccountTypes(NetTypes.MAINNET)()
  }

  useEffect(() => {
    if (currentAccount?.netType !== NetType.MAINNET) {
      setCurrentAccount(
        sortedMainnetAccounts.length ? sortedMainnetAccounts[0] : null,
      )
    }
  }, [currentAccount, setCurrentAccount, sortedMainnetAccounts])

  return (
    <AccountSelector ref={accountSelectorRef}>
      <View className="flex-1">
        <View className="flex-1" />
        <View className="my-6 flex-row items-center justify-center">
          {isCrowdspot ? (
            <Crowdspot height={70} width={70} />
          ) : (
            <AddDappArt
              colorClassName="accent-foreground"
              height={70}
              width={70}
            />
          )}
          <View className="mx-2">
            <DappEllipsis />
          </View>
          <AccountIcon address={currentAccount?.address} size={70} />
        </View>
        <Text size="4xl" className="text-center">
          {t('dappLogin.account.title', {
            appName,
          })}
        </Text>
        <Text
          size="xl"
          className="my-6 text-center font-medium text-muted-foreground"
        >
          {t('dappLogin.account.subtitle', { appName })}
        </Text>
        <AccountButton
          title={currentAccount?.alias}
          address={currentNetworkAddress}
          onPress={handleAccountButtonPress}
        />
        <View className="flex-[1.5]" />
        <View className="flex-row gap-4">
          <Button
            variant="outline"
            size="dashboard"
            className="flex-1"
            onPress={onCancel}
          >
            {t('generic.cancel')}
          </Button>
          <Button
            variant="cta"
            size="dashboard"
            className="flex-1"
            onPress={onLogin}
            disabled={loading}
          >
            {loading ? (
              <Spinner colorClassName="accent-white" />
            ) : (
              t('dappLogin.login')
            )}
          </Button>
        </View>
      </View>
    </AccountSelector>
  )
}

export default DappLogin
