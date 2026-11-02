import Address from '@helium/address'
import { useMint } from '@helium/helium-react-hooks'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import { PublicKey } from '@solana/web3.js'
import { AccountIcon } from '@ui/AccountIcon'
import { Input } from '@ui/Input'
import { PressableScale } from '@ui/PressableScale'
import { Text } from '@ui/Text'
import { twMerge } from '@ui/twMerge'
import { shortenAddress } from '@utils/formatting'
import { humanReadable } from '@utils/solanaUtils'
import BN from 'bn.js'
import { CircleUser, X } from 'lucide-react-native'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Keyboard,
  NativeSyntheticEvent,
  TextInputEndEditingEventData,
  View,
} from 'react-native'
import { withUniwind } from 'uniwind'
import { useDebounce } from 'use-debounce'
import { CSAccount } from '../../storage/cloudStorage'
import { useBalance } from '../../utils/Balance'
import {
  accountNetType,
  ellipsizeAddress,
  solAddressIsValid,
} from '../../utils/accountUtils'
import MemoInput from './MemoInput'

export type Payment = {
  address?: string
  account?: CSAccount
  amount?: BN
  hasError?: boolean
  max?: boolean
  memo?: string
  createTokenAccountFee?: BN
}

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
  className?: string
} & Payment

const ITEM_HEIGHT = 80

const ContactIcon = withUniwind(CircleUser)
const RemoveIcon = withUniwind(X)

const AddressIcon = ({ address }: { address?: string }) => {
  if (address && Address.isValid(address)) {
    return <AccountIcon address={address} size={40} />
  }
  return <ContactIcon colorClassName="accent-muted-foreground" size={40} />
}

const PaymentItem = ({
  account,
  address,
  amount,
  fee,
  handleAddressError,
  hasError,
  hideMemo,
  index,
  memo,
  netType,
  onAddressBookSelected,
  onEditAddress,
  onEditAmount,
  onEditMemo,
  onRemove,
  onUpdateError,
  mint,
  showAmount = true,
  max: _max,
  onToggleMax: _onToggleMax,
  className,
}: Props) => {
  const decimals = useMint(mint)?.info?.decimals
  const { dcToNetworkTokens } = useBalance()
  const { t } = useTranslation()
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
    <View
      className={twMerge(
        'mx-6 overflow-hidden rounded-[20px] border border-border bg-card',
        className,
      )}
    >
      {hasError && <View className="absolute inset-0 bg-destructive/20" />}
      <View className="flex-row">
        {isDeepLink && address ? (
          <Text size="lg" className="flex-1 px-4 py-[15px] font-medium">
            {ellipsizeAddress(address)}
          </Text>
        ) : (
          <View
            className="flex-1 justify-center"
            style={{ minHeight: ITEM_HEIGHT }}
          >
            <View>
              <View className="flex-row items-center justify-between">
                <View className="mt-2 flex-1">
                  <Text />
                  <View className="absolute left-0 top-[10px]">
                    <Text size="xs" className="ms-4 text-muted-foreground">
                      {account?.alias && account?.alias.split('.').length === 2
                        ? address && shortenAddress(address, 6)
                        : account?.alias}
                    </Text>
                  </View>
                  <Input
                    className="h-auto flex-1 border-0 bg-transparent px-4 py-3 shadow-none"
                    testID="PaymentItem.Address"
                    placeholder={t('payment.enterAddress')}
                    value={rawAddress || address}
                    onChangeText={setRawAddress}
                    onEndEditing={handleAddressBlur}
                    autoCapitalize="none"
                    numberOfLines={1}
                    multiline={false}
                    autoComplete="off"
                    autoCorrect={false}
                    returnKeyType="done"
                  />
                  {isProgramAccount ? (
                    <Text className="mb-2 ml-4 text-warning-500">
                      {t('payment.programOwnedWarning')}
                    </Text>
                  ) : null}
                </View>
                <PressableScale
                  feedback="opacity"
                  className="me-4"
                  onPress={handleAddressBookSelected}
                >
                  <AddressIcon address={address} />
                </PressableScale>
              </View>
            </View>
          </View>
        )}
        {!!onRemove && (
          <PressableScale
            feedback="opacity"
            className="justify-center pr-4"
            onPress={handleRemove}
          >
            <RemoveIcon colorClassName="accent-muted-foreground" size={20} />
          </PressableScale>
        )}
      </View>

      <View className="h-px bg-border" />

      {showAmount && (
        <View className="flex-row" style={{ minHeight: ITEM_HEIGHT }}>
          {!amount || amount?.isZero() ? (
            <>
              <PressableScale
                feedback="opacity"
                testID="PaymentItem.Amount"
                onPress={handleEditAmount}
                className="flex-1 justify-center"
              >
                {!loadingMeta && (
                  <Text
                    size="lg"
                    className="p-4 font-thin text-muted-foreground opacity-30"
                  >
                    {t('payment.enterAmount', {
                      ticker: symbol,
                    })}
                  </Text>
                )}
              </PressableScale>
            </>
          ) : (
            <PressableScale
              feedback="opacity"
              className="flex-1 justify-center"
              onPress={handleEditAmount}
            >
              <Text size="lg" className="px-4 font-medium">
                {humanReadable(amount, decimals)}
              </Text>
              {fee && (
                <Text size="xs" className="px-4 opacity-30">
                  {t('payment.fee', {
                    value: humanReadable(feeAsTokens, 8),
                  })}
                </Text>
              )}
            </PressableScale>
          )}
        </View>
      )}

      {!hideMemo && (
        <>
          <View className="h-px bg-border" />

          <View className="justify-center" style={{ minHeight: ITEM_HEIGHT }}>
            <MemoInput value={memo} onChangeText={handleEditMemo} />
          </View>
        </>
      )}
    </View>
  )
}
export default React.memo(PaymentItem)
