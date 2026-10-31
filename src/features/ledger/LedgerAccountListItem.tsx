import { toBN } from '@helium/spl-utils'
import { LedgerAccount } from '@hooks/useLedger'
import { AccountIcon } from '@ui/AccountIcon'
import { Checkbox } from '@ui/Checkbox'
import { Text } from '@ui/Text'
import { twMerge } from '@ui/twMerge'
import { humanReadable } from '@utils/solanaUtils'
import React from 'react'
import { View } from 'react-native'
import { ellipsizeAddress } from '../../utils/accountUtils'

export enum Section {
  NEW_ACCOUNT = 0,
  ALREADY_LINKED = 1,
}

type LedgerAccountListItemProps = {
  item: LedgerAccount
  isSelected: boolean
  index: number
  section: {
    title: string
    index: number
    data: LedgerAccount[]
  }
  onCheckboxToggled: (account: LedgerAccount, value: boolean) => void
}
const LedgerAccountListItem = ({
  item: account,
  isSelected,
  index,
  onCheckboxToggled,
  section,
}: LedgerAccountListItemProps) => {
  // TODO: Add other token types once nano app supports them
  const balance = toBN(account.balance || 0, 8)
  const disabled = section.index === Section.ALREADY_LINKED

  const isFirst = index === 0
  const isLast = index === section.data.length - 1

  const handleCheckboxToggled = (value: boolean) => {
    onCheckboxToggled(account, value)
  }

  return (
    <View className="px-6">
      <View
        className={twMerge(
          'flex-row items-center overflow-hidden bg-card p-4',
          isFirst && 'rounded-t-[20px]',
          isLast && 'rounded-b-[20px]',
          disabled && 'opacity-50',
        )}
      >
        <AccountIcon size={40} address={account.address} />
        <View className="mx-6 grow">
          <Text className="mb-0.5 font-medium text-muted-foreground">
            {account.pathLabel} ({account.derivationPath})
          </Text>
          <Text size="lg" className="mb-0.5 font-medium">
            {account.alias}
          </Text>
          <Text
            className="text-muted-foreground"
            numberOfLines={1}
            adjustsFontSizeToFit
            maxFontSizeMultiplier={1.2}
          >
            {`${ellipsizeAddress(account.solanaAddress, {
              numChars: 4,
            })} | ${humanReadable(balance, 8)}`}
          </Text>
        </View>
        <View className="me-2">
          <Checkbox
            disabled={!!disabled}
            checked={isSelected || section.index === Section.ALREADY_LINKED}
            onChange={handleCheckboxToggled}
          />
        </View>
      </View>
      {!isLast ? <View className="h-px bg-background" /> : null}
    </View>
  )
}

export default LedgerAccountListItem
