import React, { useCallback, memo, useMemo } from 'react'
import CheckBox from '@react-native-community/checkbox'
import { TokenType } from '../../generated/graphql'
import Box from '../../components/Box'
import Text from '../../components/Text'
import Surface from '../../components/Surface'
import AccountIcon from '../../components/AccountIcon'
import { useColors } from '../../theme/themeHooks'
import { balanceToString, useBalance } from '../../utils/Balance'
import { ellipsizeAddress, isTestnet } from '../../utils/accountUtils'
import {
  LedgerAccount,
  setLedgerAccounts,
  useLedgerAccounts,
} from '../../utils/heliumLedger'

type AccountListItemProps = {
  item: LedgerAccount
  index: number
  section: {
    title: string
    index: number
    data: LedgerAccount[]
  }
}
const AccountListItem = ({ item, index, section }: AccountListItemProps) => {
  const { bonesToBalance } = useBalance()
  const colors = useColors()
  const ledgerAccounts = useLedgerAccounts()

  const onCheckboxToggled = useCallback(
    (checked) => {
      setLedgerAccounts(
        ledgerAccounts.map((a) => {
          if (a.address === item.address) {
            return { ...a, isSelected: checked }
          }
          return a
        }),
      )
    },
    [item.address, ledgerAccounts],
  )

  // TODO: Add other token types once nano app supports them
  const balance = bonesToBalance(item.balance, TokenType.Hnt)
  const disabled = section.index === 1

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
        backgroundColor={isTestnet(item.address) ? 'lividBrown' : 'secondary'}
      >
        <AccountIcon size={40} address={item.address} />
        <Box marginRight="l" marginLeft="l" flexGrow={1}>
          <Text variant="subtitle2" marginBottom="xxs">
            {item.alias}
          </Text>
          <Text
            variant="body2"
            color="secondaryText"
            numberOfLines={1}
            adjustsFontSizeToFit
            maxFontSizeMultiplier={1.2}
          >
            {`${ellipsizeAddress(item.address, {
              numChars: 4,
            })} | ${balanceToString(balance, {
              maxDecimalPlaces: 2,
            })}`}
          </Text>
        </Box>
        <Box marginEnd="s">
          <CheckBox
            disabled={!!disabled}
            style={{ width: 25, height: 25 }}
            value={item.isSelected}
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
            onValueChange={onCheckboxToggled}
          />
        </Box>
      </Surface>
      {hasBottomBorder ? <Box backgroundColor="primary" height={1} /> : null}
    </Box>
  )
}

export default memo(AccountListItem)
