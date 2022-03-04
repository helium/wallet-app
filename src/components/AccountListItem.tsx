import React, { memo, useCallback } from 'react'
import Checkmark from '@assets/images/checkIco.svg'
import TouchableOpacityBox from './TouchableOpacityBox'
import Text from './Text'
import Box from './Box'
import AccountIcon from './AccountIcon'
import { useColors } from '../theme/themeHooks'
import { formatAccountAlias } from '../utils/accountUtils'
import { CSAccount } from '../storage/cloudStorage'

type Props = {
  selected: boolean
  account: CSAccount
  onPress?: (account: CSAccount) => void
  disabled?: boolean
}
const AccountListItem = ({ selected, account, onPress, disabled }: Props) => {
  const { primary } = useColors()
  const handlePress = useCallback(() => onPress?.(account), [account, onPress])
  return (
    <TouchableOpacityBox
      minHeight={52}
      paddingVertical="m"
      paddingHorizontal="xl"
      flexDirection="row"
      alignItems="center"
      borderBottomWidth={1}
      borderColor="primary"
      onPress={handlePress}
      disabled={disabled}
    >
      <AccountIcon size={40} address={account.address} />
      <Text variant="body1" marginLeft="ms" flex={1}>
        {formatAccountAlias(account)}
      </Text>
      {selected && (
        <Box
          backgroundColor="surfaceContrast"
          height={27}
          width={27}
          borderRadius="round"
          justifyContent="center"
          alignItems="center"
        >
          <Checkmark color={primary} />
        </Box>
      )}
    </TouchableOpacityBox>
  )
}

export default memo(AccountListItem)
