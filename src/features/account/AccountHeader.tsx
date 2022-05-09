import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { NetTypes as NetType } from '@helium/address'
import AccountIcon from '../../components/AccountIcon'
import Box from '../../components/Box'
import Text from '../../components/Text'
import { CSAccount } from '../../storage/cloudStorage'
import { formatAccountAlias } from '../../utils/accountUtils'
import useAccountRewardsSum from './useAccountRewardsSum'

type Props = {
  account: CSAccount
}
const AccountHeader = ({ account }: Props) => {
  const { t } = useTranslation()
  const { change, minutesAgo, formattedChange } = useAccountRewardsSum(
    account.address,
  )

  return (
    <Box
      minHeight={88}
      alignItems="center"
      flexDirection="row"
      padding="l"
      borderRadius="xl"
      overflow="hidden"
      backgroundColor={
        account.netType === NetType.TESTNET ? 'lividBrown' : 'secondary'
      }
    >
      <AccountIcon size={40} address={account.address} />
      <Box marginLeft="s" flex={1}>
        <Text variant="subtitle2" numberOfLines={1}>
          {formatAccountAlias(account)}
        </Text>
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
    </Box>
  )
}

export default memo(AccountHeader)
