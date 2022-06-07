import React, { memo, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import ChevronDown from '@assets/images/chevronDown.svg'
import Balance, { NetworkTokens, TestNetworkTokens } from '@helium/currency'
import { AccountNetTypeOpt } from '../../../utils/accountUtils'
import { balanceToString, useBalance } from '../../../utils/Balance'
import InternetPurchaseLineItem from './InternetPurchaseLineItem'
import { useAccountSelector } from '../../../components/AccountSelector'
import { useAccountStorage } from '../../../storage/AccountStorageProvider'
import Text from '../../../components/Text'
import TouchableOpacityBox from '../../../components/TouchableOpacityBox'
import AccountIcon from '../../../components/AccountIcon'

type Props = {
  accountsType: AccountNetTypeOpt
  tokenCost?: Balance<NetworkTokens | TestNetworkTokens>
  visible: boolean
  remainingBalance?: Balance<TestNetworkTokens | NetworkTokens>
  hasSufficientBalance: boolean
  currencyString: string
}

const InternetTokenPurchase = ({
  accountsType,
  currencyString,
  hasSufficientBalance,
  remainingBalance,
  tokenCost,
  visible,
}: Props) => {
  const { showAccountTypes } = useAccountSelector()
  const { currentAccount } = useAccountStorage()
  const [remainingCurrencyString, setRemainingCurrencyString] = useState('')
  const { t } = useTranslation()
  const { toCurrencyString } = useBalance()

  useEffect(() => {
    toCurrencyString(remainingBalance).then(setRemainingCurrencyString)
  }, [remainingBalance, toCurrencyString])

  if (!visible) return null

  return (
    <>
      <TouchableOpacityBox
        paddingHorizontal="xl"
        paddingVertical="l"
        borderBottomColor="primaryBackground"
        borderBottomWidth={1}
        flexDirection="row"
        alignItems="center"
        onPress={showAccountTypes(accountsType)}
      >
        <AccountIcon size={26} address={currentAccount?.address} />
        <Text marginLeft="ms" variant="subtitle2" flex={1}>
          {currentAccount?.alias}
        </Text>
        <ChevronDown />
      </TouchableOpacityBox>
      <InternetPurchaseLineItem
        paddingVertical="l"
        paddingHorizontal="xl"
        title={t('generic.total')}
        value={currencyString}
        subValue={balanceToString(tokenCost, {
          maxDecimalPlaces: 3,
        })}
      />
      <InternetPurchaseLineItem
        paddingHorizontal="xl"
        paddingVertical="l"
        borderTopColor="primaryBackground"
        borderTopWidth={1}
        title={t('internet.remainingBalance')}
        value={balanceToString(remainingBalance, {
          maxDecimalPlaces: 3,
        })}
        subValue={remainingCurrencyString}
        error={
          !hasSufficientBalance ? t('internet.insufficientFunds') : undefined
        }
      />
    </>
  )
}

export default memo(InternetTokenPurchase)
