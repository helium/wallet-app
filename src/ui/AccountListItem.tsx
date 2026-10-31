import type { CSAccount } from '@storage/cloudStorage'
import { ellipsizeAddress, formatAccountAlias } from '@utils/accountUtils'
import { Check } from 'lucide-react-native'
import React from 'react'
import { View } from 'react-native'
import { withUniwind } from 'uniwind'
import { AccountIcon } from './AccountIcon'
import { Text } from './Text'
import { TouchableContainer } from './TouchableContainer'

const CheckIcon = withUniwind(Check)

export type AccountListItemProps = {
  selected: boolean
  account: CSAccount
  onPress?: (account: CSAccount) => void
  disabled?: boolean
}

// An account row: its icon, alias and short Solana address, and a check when
// selected. A press reports the account.
export const AccountListItem = ({
  selected,
  account,
  onPress,
  disabled,
}: AccountListItemProps) => {
  const address = account.solanaAddress

  return (
    <TouchableContainer
      className="min-h-[52px] flex-row items-center border-b border-border px-8 py-4"
      onPress={() => onPress?.(account)}
      disabled={disabled}
    >
      <AccountIcon size={40} address={address} />
      <View className="flex-1 justify-center">
        <Text size="base" className="ml-3">
          {formatAccountAlias(account)}
        </Text>
        <Text size="xs" className="ml-3 text-muted-foreground">
          {ellipsizeAddress(address || '')}
        </Text>
      </View>
      {selected ? (
        <View className="size-[27px] items-center justify-center rounded-full bg-primary">
          <CheckIcon size={16} colorClassName="accent-primary-foreground" />
        </View>
      ) : null}
    </TouchableContainer>
  )
}
