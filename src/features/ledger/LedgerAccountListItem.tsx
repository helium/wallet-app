import AccountIcon from '@components/AccountIcon'
import Box from '@components/Box'
import Surface from '@components/Surface'
import Text from '@components/Text'
import { toBN } from '@helium/spl-utils'
import { LedgerAccount } from '@hooks/useLedger'
import CheckBox from '@react-native-community/checkbox'
import { useColors } from '@theme/themeHooks'
import { humanReadable } from '@utils/solanaUtils'
import React, { memo, useCallback, useMemo } from 'react'
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
  const colors = useColors()

  // TODO: Add other token types once nano app supports them
  const balance = toBN(account.balance || 0, 8)
  const disabled = section.index === Section.ALREADY_LINKED

  const borderTopEndRadius = useMemo(
    () => (index === 0 ? 'xl' : 'none'),
    [index],
  )
  const borderTopStartRadius = useMemo(
    () => (index === 0 ? 'xl' : 'none'),
    [index],
  )
  const borderBottomEndRadius = useMemo(
    () => (index === section.data.length - 1 ? 'xl' : 'none'),
    [index, section.data.length],
  )
  const borderBottomStartRadius = useMemo(
    () => (index === section.data.length - 1 ? 'xl' : 'none'),
    [index, section.data.length],
  )
  const hasBottomBorder = useMemo(
    () => index !== section.data.length - 1,
    [index, section.data.length],
  )

  const handleCheckboxToggled = useCallback(
    (value: boolean) => {
      onCheckboxToggled(account, value)
    },
    [account, onCheckboxToggled],
  )

  return (
    <Box paddingHorizontal="l">
      <Surface
        flexDirection="row"
        alignItems="center"
        padding="m"
        opacity={disabled ? 0.5 : 1}
        borderTopEndRadius={borderTopEndRadius}
        borderTopStartRadius={borderTopStartRadius}
        borderBottomEndRadius={borderBottomEndRadius}
        borderBottomStartRadius={borderBottomStartRadius}
        backgroundColor="secondary"
      >
        <AccountIcon size={40} address={account.address} />
        <Box marginRight="l" marginLeft="l" flexGrow={1}>
          <Text variant="subtitle2" marginBottom="xxs">
            {account.alias}
          </Text>
          <Text
            variant="body2"
            color="secondaryText"
            numberOfLines={1}
            adjustsFontSizeToFit
            maxFontSizeMultiplier={1.2}
          >
            {`${ellipsizeAddress(account.solanaAddress, {
              numChars: 4,
            })} | ${humanReadable(balance, 8)}`}
          </Text>
        </Box>
        <Box marginEnd="s">
          <CheckBox
            disabled={!!disabled}
            style={{ width: 25, height: 25 }}
            value={isSelected || section.index === Section.ALREADY_LINKED}
            tintColors={{
              true: colors.purple500,
              false: colors.surfaceSecondary,
            }}
            onFillColor={colors.white}
            onCheckColor={colors.surfaceSecondary}
            onTintColor={colors.white}
            tintColor={colors.white}
            onAnimationType="fill"
            offAnimationType="fill"
            boxType="circle"
            lineWidth={2}
            onValueChange={handleCheckboxToggled}
          />
        </Box>
      </Surface>
      {hasBottomBorder ? <Box backgroundColor="primary" height={1} /> : null}
    </Box>
  )
}

export default memo(LedgerAccountListItem)
