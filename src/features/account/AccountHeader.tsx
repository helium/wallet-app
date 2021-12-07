import React, { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Address, NetType } from '@helium/crypto-react-native'
import AccountIcon from '../../components/AccountIcon'
import Box from '../../components/Box'
import Surface from '../../components/Surface'
import Text from '../../components/Text'
import { CSAccount } from '../../storage/AccountStorageProvider'
import useAccountRewardsSum from './useAccountRewardsSum'

type Props = {
  account: CSAccount
}
const AccountHeader = ({ account }: Props) => {
  const { t } = useTranslation()
  const { change, minutesAgo, formattedChange } = useAccountRewardsSum(
    account.address,
  )

  const netType = useMemo(() => {
    return Address.fromB58(account.address)?.netType === NetType.TESTNET
      ? `(${t('onboarding.testnet')})`
      : ''
  }, [account.address, t])

  return (
    <Surface minHeight={88} alignItems="center" flexDirection="row" padding="l">
      <AccountIcon size={40} address={account.address} />
      <Box marginLeft="s" flex={1}>
        <Text variant="subtitle2">{`${account.alias} ${netType}`}</Text>
        <Text variant="body3" color="secondaryText">
          {minutesAgo !== undefined
            ? t('accountHeader.timeAgo', { formattedChange })
            : ''}
        </Text>
      </Box>
      <Box marginLeft="s">
        <Text variant="subtitle2" color="greenBright500">
          {change !== undefined ? `${change > 0 ? '+' : ''}${change}%` : ''}
        </Text>
        <Text variant="body3" color="secondaryText" textAlign="right">
          {t('accountHeader.last24')}
        </Text>
      </Box>
    </Surface>
  )
}

export default memo(AccountHeader)
