import React, {
  memo as reactMemo,
  useCallback,
  useEffect,
  useMemo,
} from 'react'
import {
  Balance,
  DataCredits,
  NetworkTokens,
  TestNetworkTokens,
} from '@helium/currency'
import { useTranslation } from 'react-i18next'
import Remove from '@assets/images/remove.svg'
import ContactIcon from '@assets/images/account.svg'
import {
  ActivityIndicator,
  Keyboard,
  NativeSyntheticEvent,
  TextInputFocusEventData,
} from 'react-native'
import Address from '@helium/address'
import Box from '../../components/Box'
import { accountNetType, ellipsizeAddress } from '../../utils/accountUtils'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import { useColors, useOpacity } from '../../theme/themeHooks'
import Text from '../../components/Text'
import { balanceToString, useBalance } from '../../utils/Balance'
import MemoInput from '../../components/MemoInput'
import { CSAccount } from '../../storage/cloudStorage'
import TextInput from '../../components/TextInput'
import { useIsHotspotOrValidatorQuery } from '../../generated/graphql'
import AccountIcon from '../../components/AccountIcon'
import BackgroundFill from '../../components/BackgroundFill'

export type Payment = {
  address?: string
  account?: CSAccount
  amount?: Balance<NetworkTokens | TestNetworkTokens>
  memo?: string
  hasError?: boolean
}

type Props = {
  index: number
  hasError?: boolean
  fee?: Balance<DataCredits>
  onAddressBookSelected: (opts: { address?: string; index: number }) => void
  onEditHNTAmount: (opts: { address?: string; index: number }) => void
  onEditMemo: (opts: { address?: string; index: number; memo: string }) => void
  onEditAddress: (opts: { index: number; address: string }) => void
  handleAddressError: (opts: {
    index: number
    address: string
    isHotspotOrValidator: boolean
  }) => void
  onRemove?: (index: number) => void
  onUpdateError?: (index: number, hasError: boolean) => void
  hideMemo?: boolean
  ticker?: string
  netType?: number
} & Payment

const ITEM_HEIGHT = 80

const PaymentItem = ({
  address,
  account,
  amount,
  index,
  onAddressBookSelected,
  onEditHNTAmount,
  onEditMemo,
  onEditAddress,
  handleAddressError,
  onUpdateError,
  fee,
  memo,
  hasError,
  onRemove,
  hideMemo,
  ticker,
  netType,
}: Props) => {
  const { colorStyle } = useOpacity('primaryText', 0.3)
  const { dcToTokens } = useBalance()
  const { t } = useTranslation()
  const { secondaryText } = useColors()

  const { error, loading, data } = useIsHotspotOrValidatorQuery({
    variables: {
      address: address || '',
    },
    skip: !address || !Address.isValid(address),
  })

  const addressIsHotspot = useMemo(
    () => data?.isHotspotOrValidator === true,
    [data],
  )

  const addressIsWrongNetType = useMemo(
    () =>
      address !== undefined &&
      address !== '' &&
      accountNetType(address) !== netType,
    [address, netType],
  )

  useEffect(() => {
    if (!onUpdateError) return
    onUpdateError(
      index,
      addressIsHotspot ||
        addressIsWrongNetType ||
        error !== undefined ||
        loading,
    )
  }, [
    addressIsHotspot,
    addressIsWrongNetType,
    error,
    index,
    loading,
    onUpdateError,
  ])

  const feeAsTokens = useMemo(() => {
    if (!fee) return

    return dcToTokens(fee)
  }, [dcToTokens, fee])

  const handleAddressBookSelected = useCallback(() => {
    Keyboard.dismiss()
    onAddressBookSelected({ index })
  }, [index, onAddressBookSelected])

  const handleEditAmount = useCallback(() => {
    onEditHNTAmount({ address, index })
  }, [address, index, onEditHNTAmount])

  const handleEditMemo = useCallback(
    (text?: string) => {
      onEditMemo({ memo: text || '', address, index })
    },
    [address, index, onEditMemo],
  )

  const handleEditAddress = useCallback(
    (text?: string) => {
      onEditAddress({ address: text || '', index })
    },
    [index, onEditAddress],
  )

  const handleAddressBlur = useCallback(
    (event?: NativeSyntheticEvent<TextInputFocusEventData>) => {
      const text = event?.nativeEvent.text
      handleAddressError({
        address: text || '',
        index,
        isHotspotOrValidator: addressIsHotspot,
      })
    },
    [addressIsHotspot, handleAddressError, index],
  )

  const handleRemove = useCallback(() => {
    onRemove?.(index)
  }, [index, onRemove])

  const isDeepLink = useMemo(
    () => address && !account?.address,
    [account, address],
  )

  const AddressIcon = useCallback(() => {
    if (address && Address.isValid(address)) {
      return <AccountIcon address={address} size={25} />
    }
    return <ContactIcon color={secondaryText} />
  }, [address, secondaryText])

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
          <Box flex={1} minHeight={ITEM_HEIGHT}>
            <Text
              marginHorizontal="m"
              marginTop="s"
              variant="body3"
              color="secondaryText"
            >
              {account?.alias}
            </Text>
            <Box
              flexDirection="row"
              justifyContent="space-between"
              alignItems="center"
              marginRight="m"
            >
              <TextInput
                variant="transparent"
                flex={1}
                placeholder={t('payment.enterAddress')}
                value={address}
                onChangeText={handleEditAddress}
                onBlur={handleAddressBlur}
                autoCapitalize="none"
                numberOfLines={1}
                multiline={false}
                autoComplete="off"
                autoCorrect={false}
                returnKeyType="done"
              />
              {loading ? (
                <ActivityIndicator size="small" color={secondaryText} />
              ) : (
                <TouchableOpacityBox onPress={handleAddressBookSelected}>
                  <AddressIcon />
                </TouchableOpacityBox>
              )}
            </Box>
            <Text
              opacity={
                error || data?.isHotspotOrValidator || hasError ? 100 : 0
              }
              marginHorizontal="m"
              variant="body3"
              marginBottom="xxs"
              color="red500"
            >
              {error ? t('generic.loadFailed') : t('generic.notValidAddress')}
            </Text>
          </Box>
        )}
        {!!onRemove && (
          <TouchableOpacityBox
            justifyContent="center"
            paddingRight="m"
            onPress={handleRemove}
          >
            <Remove color={secondaryText} />
          </TouchableOpacityBox>
        )}
      </Box>

      <Box height={1} backgroundColor="primaryBackground" />

      <TouchableOpacityBox
        minHeight={ITEM_HEIGHT}
        justifyContent="center"
        onPress={handleEditAmount}
      >
        {!amount || amount?.integerBalance === 0 ? (
          <Text
            color="secondaryText"
            paddingHorizontal="m"
            variant="subtitle2"
            fontWeight="100"
            style={colorStyle}
          >
            {t('payment.enterAmount', {
              ticker,
            })}
          </Text>
        ) : (
          <>
            <Text paddingHorizontal="m" variant="subtitle2" color="primaryText">
              {balanceToString(amount)}
            </Text>
            {fee && (
              <Text paddingHorizontal="m" variant="body3" style={colorStyle}>
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

      {!hideMemo && (
        <>
          <Box height={1} backgroundColor="primaryBackground" />

          <MemoInput
            value={memo}
            onChangeText={handleEditMemo}
            minHeight={ITEM_HEIGHT}
          />
        </>
      )}
    </Box>
  )
}
export default reactMemo(PaymentItem)
