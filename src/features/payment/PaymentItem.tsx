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
  TextInputEndEditingEventData,
} from 'react-native'
import Address from '@helium/address'
import { toUpper } from 'lodash'
import { BoxProps } from '@shopify/restyle'
import Box from '@components/Box'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { useColors, useOpacity } from '@theme/themeHooks'
import Text from '@components/Text'
import MemoInput from '@components/MemoInput'
import TextInput from '@components/TextInput'
import AccountIcon from '@components/AccountIcon'
import BackgroundFill from '@components/BackgroundFill'
import { Theme } from '@theme/theme'
import { useIsHotspotOrValidatorQuery } from '../../generated/graphql'
import { CSAccount } from '../../storage/cloudStorage'
import { balanceToString, useBalance } from '../../utils/Balance'
import { accountNetType, ellipsizeAddress } from '../../utils/accountUtils'
import { useAppStorage } from '../../storage/AppStorageProvider'

export type Payment = {
  address?: string
  account?: CSAccount
  amount?: Balance<NetworkTokens | TestNetworkTokens>
  memo?: string
  hasError?: boolean
  max?: boolean
} & BoxProps<Theme>

type Props = {
  index: number
  hasError?: boolean
  fee?: Balance<DataCredits>
  onAddressBookSelected: (opts: { address?: string; index: number }) => void
  onEditAmount: (opts: { address?: string; index: number }) => void
  onToggleMax: (opts: { address?: string; index: number }) => void
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
  showAmount?: boolean
} & Payment

const ITEM_HEIGHT = 80

const PaymentItem = ({
  account,
  address,
  amount,
  fee,
  handleAddressError,
  hasError,
  hideMemo,
  index,
  max,
  memo,
  netType,
  onAddressBookSelected,
  onEditAddress,
  onEditAmount,
  onEditMemo,
  onRemove,
  onToggleMax,
  onUpdateError,
  ticker,
  showAmount = true,
  ...boxProps
}: Props) => {
  const { colorStyle } = useOpacity('primaryText', 0.3)
  const { dcToNetworkTokens } = useBalance()
  const { t } = useTranslation()
  const { secondaryText } = useColors()
  const { l1Network } = useAppStorage()

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

    return dcToNetworkTokens(fee)
  }, [dcToNetworkTokens, fee])

  const handleAddressBookSelected = useCallback(() => {
    Keyboard.dismiss()
    onAddressBookSelected({ index })
  }, [index, onAddressBookSelected])

  const handleEditAmount = useCallback(() => {
    onEditAmount({ address, index })
  }, [address, index, onEditAmount])

  const handleToggleMax = useCallback(() => {
    onToggleMax({ address, index })
  }, [address, index, onToggleMax])

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
    (event?: NativeSyntheticEvent<TextInputEndEditingEventData>) => {
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
    () =>
      address &&
      !(l1Network === 'helium' ? account?.address : account?.solanaAddress),
    [account, address, l1Network],
  )

  const AddressIcon = useCallback(() => {
    if (address && Address.isValid(address)) {
      return <AccountIcon address={address} size={40} />
    }
    return <ContactIcon color={secondaryText} />
  }, [address, secondaryText])

  return (
    <Box
      marginHorizontal="l"
      backgroundColor="secondary"
      borderRadius="xl"
      overflow="hidden"
      {...boxProps}
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
          <Box flex={1} minHeight={ITEM_HEIGHT} justifyContent="center">
            <Box>
              <Box
                flexDirection="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Box flex={1} marginTop="s">
                  <Text />
                  <Box position="absolute" top={10} left={0}>
                    <Text marginStart="m" variant="body3" color="secondaryText">
                      {account?.alias}
                    </Text>
                  </Box>
                  <TextInput
                    variant="transparent"
                    flex={1}
                    textInputProps={{
                      placeholder: t('payment.enterAddress'),
                      value: address,
                      onChangeText: handleEditAddress,
                      onEndEditing: handleAddressBlur,
                      autoCapitalize: 'none',
                      numberOfLines: 1,
                      multiline: false,
                      autoComplete: 'off',
                      autoCorrect: false,
                      returnKeyType: 'done',
                    }}
                  />
                  <Text
                    opacity={
                      error || data?.isHotspotOrValidator || hasError ? 100 : 0
                    }
                    marginHorizontal="m"
                    variant="body3"
                    marginBottom="xxs"
                    color="red500"
                  >
                    {error
                      ? t('generic.loadFailed')
                      : t('generic.notValidAddress')}
                  </Text>
                </Box>
                {loading ? (
                  <ActivityIndicator size="small" color={secondaryText} />
                ) : (
                  <TouchableOpacityBox
                    marginEnd="l"
                    onPress={handleAddressBookSelected}
                  >
                    <AddressIcon />
                  </TouchableOpacityBox>
                )}
              </Box>
            </Box>
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

      {showAmount && (
        <Box flexDirection="row" minHeight={ITEM_HEIGHT}>
          {!amount || amount?.integerBalance === 0 ? (
            <>
              <TouchableOpacityBox
                onPress={handleEditAmount}
                flex={1}
                justifyContent="center"
              >
                <Text
                  color="secondaryText"
                  padding="m"
                  variant="subtitle2"
                  fontWeight="100"
                  style={colorStyle}
                >
                  {t('payment.enterAmount', {
                    ticker,
                  })}
                </Text>
              </TouchableOpacityBox>
            </>
          ) : (
            <TouchableOpacityBox
              justifyContent="center"
              onPress={handleEditAmount}
              flex={1}
            >
              <Text
                paddingHorizontal="m"
                variant="subtitle2"
                color="primaryText"
              >
                {balanceToString(amount, {
                  maxDecimalPlaces: amount.type.decimalPlaces.toNumber(),
                })}
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
            </TouchableOpacityBox>
          )}

          <TouchableOpacityBox
            onPress={handleToggleMax}
            backgroundColor={max ? 'white' : 'transparent'}
            borderColor={max ? 'transparent' : 'surface'}
            borderWidth={1.5}
            borderRadius="m"
            paddingVertical="xs"
            paddingHorizontal="ms"
            marginRight="ms"
            marginVertical="l"
            justifyContent="center"
            disabled
            visible={false} // TODO: Enable once we move to solana (will need some rework)
          >
            <Text variant="body3" color={max ? 'black900' : 'secondaryText'}>
              {toUpper(t('payment.max'))}
            </Text>
          </TouchableOpacityBox>
        </Box>
      )}

      {!hideMemo && (
        <>
          <Box height={1} backgroundColor="primaryBackground" />

          <Box justifyContent="center" minHeight={ITEM_HEIGHT}>
            <MemoInput value={memo} onChangeText={handleEditMemo} />
          </Box>
        </>
      )}
    </Box>
  )
}
export default reactMemo(PaymentItem)
