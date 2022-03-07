import React, { memo as reactMemo, useCallback, useMemo } from 'react'
import {
  Balance,
  DataCredits,
  NetworkTokens,
  TestNetworkTokens,
} from '@helium/currency'
import { useTranslation } from 'react-i18next'
import { BoxProps } from '@shopify/restyle'
import Remove from '@assets/images/remove.svg'
import AccountButton from '../../components/AccountButton'
import Box from '../../components/Box'
import { accountNetType, ellipsizeAddress } from '../../utils/accountUtils'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import { useColors, useOpacity } from '../../theme/themeHooks'
import Text from '../../components/Text'
import { balanceToString, useBalance } from '../../utils/Balance'
import MemoInput from '../../components/MemoInput'
import { Theme } from '../../theme/theme'
import { CSAccount } from '../../storage/cloudStorage'
import BackgroundFill from '../../components/BackgroundFill'

export type Payment = {
  address?: string
  account?: CSAccount
  amount?: Balance<NetworkTokens | TestNetworkTokens>
  memo?: string
}

type Props = {
  index: number
  hasError?: boolean
  fee?: Balance<DataCredits>
  onAddressBookSelected: (opts: { address?: string; index: number }) => void
  onEditHNTAmount: (opts: { address?: string; index: number }) => void
  onEditMemo: (opts: { address?: string; index: number; memo: string }) => void
  onRemove?: (index: number) => void
} & Payment

const PaymentItem = ({
  address,
  account,
  amount,
  index,
  onAddressBookSelected,
  onEditHNTAmount,
  onEditMemo,
  fee,
  memo,
  hasError,
  onRemove,
}: Props) => {
  const { colorStyle } = useOpacity('primaryText', 0.3)
  const { dcToTokens } = useBalance()
  const { t } = useTranslation()
  const { secondaryText } = useColors()

  const title = useMemo(() => {
    return account?.alias || address || t('payment.selectContact')
  }, [account, address, t])

  const feeAsTokens = useMemo(() => {
    if (!fee) return

    return dcToTokens(fee)
  }, [dcToTokens, fee])

  const handleAddressBookSelected = useCallback(
    (addy?: string) => {
      onAddressBookSelected({ address: addy, index })
    },
    [index, onAddressBookSelected],
  )

  const handleEditAmount = useCallback(() => {
    onEditHNTAmount({ address, index })
  }, [address, index, onEditHNTAmount])

  const handleEditMemo = useCallback(
    (text?: string) => {
      onEditMemo({ memo: text || '', address, index })
    },
    [address, index, onEditMemo],
  )

  const handleRemove = useCallback(() => {
    onRemove?.(index)
  }, [index, onRemove])

  const netType = useMemo(() => {
    if (account?.netType) {
      return account.netType
    }
    return accountNetType(address)
  }, [account, address])

  const innerBoxProps = useMemo(
    () =>
      ({
        borderRadius: 'none',
        backgroundColor: undefined,
      } as BoxProps<Theme>),
    [],
  )
  const isDeepLink = useMemo(
    () => address && !account?.address,
    [account, address],
  )

  return (
    <Box
      marginTop="l"
      marginHorizontal="l"
      backgroundColor="secondary"
      borderRadius="xl"
      overflow="hidden"
    >
      {hasError && <BackgroundFill backgroundColor="error" opacity={0.2} />}
      <Box flexDirection="row">
        {isDeepLink && address ? (
          <Text
            variant="subtitle2"
            color="primaryText"
            flex={1}
            paddingHorizontal="l"
            paddingVertical="m"
          >
            {ellipsizeAddress(address)}
          </Text>
        ) : (
          <AccountButton
            flex={1}
            showChevron={false}
            title={title}
            subtitle={
              account?.address ? ellipsizeAddress(account.address) : undefined
            }
            address={address || account?.address}
            onPress={handleAddressBookSelected}
            netType={netType}
            innerBoxProps={innerBoxProps}
          />
        )}
        {!!onRemove && (
          <TouchableOpacityBox
            justifyContent="center"
            paddingHorizontal="l"
            onPress={handleRemove}
          >
            <Remove color={secondaryText} />
          </TouchableOpacityBox>
        )}
      </Box>

      {(address || account?.address) && (
        <>
          <Box height={1} backgroundColor="primaryBackground" />

          <TouchableOpacityBox
            minHeight={80}
            justifyContent="center"
            onPress={handleEditAmount}
          >
            {!amount || amount?.integerBalance === 0 ? (
              <Text
                color="secondaryText"
                paddingHorizontal="m"
                variant="subtitle2"
                style={colorStyle}
              >
                {t('payment.enterAmount', {
                  ticker: amount?.type.ticker,
                })}
              </Text>
            ) : (
              <>
                <Text
                  paddingHorizontal="m"
                  variant="subtitle2"
                  color="primaryText"
                >
                  {balanceToString(amount)}
                </Text>
                {fee && (
                  <Text
                    paddingHorizontal="m"
                    variant="body3"
                    style={colorStyle}
                  >
                    {t('payment.fee', {
                      value: balanceToString(feeAsTokens, {
                        maxDecimalPlaces: 4,
                      }),
                    })}
                  </Text>
                )}
              </>
            )}
          </TouchableOpacityBox>

          <Box height={1} backgroundColor="primaryBackground" />

          <MemoInput
            value={memo}
            onChangeText={handleEditMemo}
            minHeight={80}
          />
        </>
      )}
    </Box>
  )
}
export default reactMemo(PaymentItem)
