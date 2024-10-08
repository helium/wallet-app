import AddressIcon from '@assets/images/addressIcon.svg'
import Remove from '@assets/images/remove.svg'
import BackgroundFill from '@components/BackgroundFill'
import Box from '@components/Box'
import MemoInput from '@components/MemoInput'
import Text from '@components/Text'
import TextInput from '@components/TextInput'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { useMint } from '@helium/helium-react-hooks'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import { BoxProps } from '@shopify/restyle'
import { PublicKey } from '@solana/web3.js'
import { Theme } from '@theme/theme'
import { useColors } from '@theme/themeHooks'
import { humanReadable } from '@utils/solanaUtils'
import BN from 'bn.js'
import { toUpper } from 'lodash'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Keyboard,
  NativeSyntheticEvent,
  TextInputEndEditingEventData,
} from 'react-native'
import { useDebounce } from 'use-debounce'
import { CSAccount } from '../../storage/cloudStorage'
import { useBalance } from '../../utils/Balance'
import {
  accountNetType,
  ellipsizeAddress,
  solAddressIsValid,
} from '../../utils/accountUtils'

export type Payment = {
  address?: string
  account?: CSAccount
  amount?: BN
  hasError?: boolean
  max?: boolean
  memo?: string
  createTokenAccountFee?: BN
} & BoxProps<Theme>

type Props = {
  index: number
  hasError?: boolean
  fee?: BN
  onAddressBookSelected: (opts: { address?: string; index: number }) => void
  onEditAmount: (opts: { address?: string; index: number }) => void
  onToggleMax?: (opts: { address?: string; index: number }) => void
  onEditAddress: (opts: { index: number; address: string }) => void
  onEditMemo?: (opts: { address?: string; index: number; memo: string }) => void
  handleAddressError: (opts: {
    index: number
    address: string
    isHotspotOrValidator: boolean
  }) => void
  onRemove?: (index: number) => void
  onUpdateError?: (index: number, hasError: boolean) => void
  hideMemo?: boolean
  mint?: PublicKey
  netType?: number
  showAmount?: boolean
} & Payment

const ITEM_HEIGHT = 74

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
  mint,
  showAmount = true,
  ...boxProps
}: Props) => {
  const decimals = useMint(mint)?.info?.decimals
  const { dcToNetworkTokens } = useBalance()
  const { t } = useTranslation()
  const { secondaryText } = useColors()
  const { symbol, loading: loadingMeta } = useMetaplexMetadata(mint)
  const [rawAddress, setRawAddress] = useState('')
  const [debouncedAddress] = useDebounce(rawAddress, 500)

  const isProgramAccount = useMemo(() => {
    if (solAddressIsValid(debouncedAddress)) {
      const pubkey = new PublicKey(debouncedAddress)
      return !PublicKey.isOnCurve(pubkey)
    }

    return false
  }, [debouncedAddress])

  const addressIsWrongNetType = useMemo(
    () =>
      address !== undefined &&
      address !== '' &&
      accountNetType(address) !== netType,
    [address, netType],
  )

  useEffect(() => {
    if (!onUpdateError) return
    onUpdateError(index, addressIsWrongNetType)
  }, [index, onUpdateError, addressIsWrongNetType])

  const handleEditAddress = useCallback(
    (text?: string) => {
      onEditAddress({ address: text || '', index })
    },
    [index, onEditAddress],
  )

  // Use debounced address if there's a domain, otherwise rawAddress
  useEffect(() => {
    if (debouncedAddress && debouncedAddress.split('.').length === 2) {
      handleEditAddress(debouncedAddress)
    }
  }, [debouncedAddress, handleEditAddress])

  useEffect(() => {
    if (rawAddress && rawAddress.split('.').length !== 2) {
      handleEditAddress(rawAddress)
    }
  }, [rawAddress, handleEditAddress])

  const feeAsTokens = useMemo(() => {
    if (!fee) return

    return dcToNetworkTokens(fee)
  }, [dcToNetworkTokens, fee])

  const handleAddressBookSelected = useCallback(() => {
    Keyboard.dismiss()
    onAddressBookSelected({ index })
    setRawAddress('')
  }, [index, onAddressBookSelected])

  const handleEditAmount = useCallback(() => {
    onEditAmount({ address, index })
  }, [address, index, onEditAmount])

  const handleToggleMax = useCallback(() => {
    if (!onToggleMax) return

    onToggleMax({ address, index })
  }, [address, index, onToggleMax])

  const handleEditMemo = useCallback(
    (text?: string) => {
      if (!onEditMemo) return

      onEditMemo({ memo: text || '', address, index })
    },
    [address, index, onEditMemo],
  )

  const handleAddressBlur = useCallback(
    (event?: NativeSyntheticEvent<TextInputEndEditingEventData>) => {
      const text = event?.nativeEvent?.text
      handleAddressError({
        address: text || '',
        index,
        isHotspotOrValidator: false,
      })
    },
    [handleAddressError, index],
  )

  const handleRemove = useCallback(() => {
    onRemove?.(index)
  }, [index, onRemove])

  const isDeepLink = useMemo(
    () => address && !account?.address,
    [account, address],
  )

  return (
    <Box marginHorizontal="6" overflow="hidden" {...boxProps}>
      {hasError && <BackgroundFill backgroundColor="error.500" opacity={0.2} />}
      <Box flexDirection="row">
        {isDeepLink && address ? (
          <Text
            variant="textLgMedium"
            color="primaryText"
            flex={1}
            paddingHorizontal="6"
            paddingVertical="4"
          >
            {ellipsizeAddress(address)}
          </Text>
        ) : (
          <Box
            marginTop="md"
            flex={1}
            minHeight={ITEM_HEIGHT}
            justifyContent="center"
            backgroundColor="cardBackground"
            borderTopStartRadius="2xl"
            borderTopEndRadius="2xl"
          >
            <Box>
              <Box
                flexDirection="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Box flex={1}>
                  <Box position="absolute" top={0} left={0}>
                    <Text
                      marginStart="4"
                      variant="textMdSemibold"
                      color="primaryText"
                    >
                      {t('payment.to')}
                    </Text>
                  </Box>
                  <TextInput
                    variant="transparentSmall"
                    flex={1}
                    marginTop="3"
                    textInputProps={{
                      placeholder: t('payment.enterAddress'),
                      value: rawAddress || address,
                      onChangeText: setRawAddress,
                      onEndEditing: handleAddressBlur,
                      autoCapitalize: 'none',
                      numberOfLines: 1,
                      multiline: false,
                      autoComplete: 'off',
                      autoCorrect: false,
                      returnKeyType: 'done',
                    }}
                  />
                  {isProgramAccount ? (
                    <Text
                      variant="textMdSemibold"
                      ml="4"
                      mb="2"
                      color="orange.500"
                    >
                      {t('payment.programOwnedWarning')}
                    </Text>
                  ) : null}
                </Box>
                <TouchableOpacityBox
                  marginEnd="6"
                  onPress={handleAddressBookSelected}
                >
                  <AddressIcon />
                </TouchableOpacityBox>
              </Box>
            </Box>
          </Box>
        )}
        {!!onRemove && (
          <TouchableOpacityBox
            justifyContent="center"
            paddingRight="4"
            onPress={handleRemove}
          >
            <Remove color={secondaryText} />
          </TouchableOpacityBox>
        )}
      </Box>

      {showAmount && (
        <Box
          flexDirection="row"
          minHeight={ITEM_HEIGHT}
          backgroundColor="cardBackground"
          borderBottomStartRadius="2xl"
          borderBottomEndRadius="2xl"
          marginTop="0.5"
        >
          {!amount || amount?.isZero() ? (
            <>
              <TouchableOpacityBox
                onPress={handleEditAmount}
                flex={1}
                justifyContent="center"
              >
                {!loadingMeta && (
                  <Text
                    color="primaryText"
                    opacity={0.3}
                    padding="4"
                    variant="textLgSemibold"
                  >
                    {t('payment.enterAmount', {
                      ticker: symbol,
                    })}
                  </Text>
                )}
              </TouchableOpacityBox>
            </>
          ) : (
            <TouchableOpacityBox
              justifyContent="center"
              onPress={handleEditAmount}
              flex={1}
            >
              <Text
                paddingHorizontal="4"
                variant="textLgMedium"
                color="primaryText"
              >
                {humanReadable(amount, decimals)}
              </Text>
              {fee && (
                <Text paddingHorizontal="4" variant="textXsRegular">
                  {t('payment.fee', {
                    value: humanReadable(feeAsTokens, 8),
                  })}
                </Text>
              )}
            </TouchableOpacityBox>
          )}

          <TouchableOpacityBox
            onPress={handleToggleMax}
            backgroundColor={max ? 'base.white' : 'transparent'}
            borderColor={max ? 'transparent' : 'cardBackground'}
            borderWidth={1.5}
            borderRadius="2xl"
            paddingVertical="xs"
            paddingHorizontal="3"
            marginRight="3"
            marginVertical="6"
            justifyContent="center"
            disabled
            visible={false} // TODO: Enable once we move to solana (will need some rework)
          >
            <Text
              variant="textXsRegular"
              color={max ? 'base.black' : 'secondaryText'}
            >
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
export default React.memo(PaymentItem)
