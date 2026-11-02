import { EPOCH_LENGTH } from '@helium/helium-sub-daos-sdk'
import { humanReadable } from '@helium/spl-utils'
import {
  PositionWithMeta,
  SubDaoWithMeta,
} from '@helium/voter-stake-registry-hooks'
import { PublicKey } from '@solana/web3.js'
import { Pill } from '@ui/Pill'
import { PressableScale } from '@ui/PressableScale'
import { Spinner } from '@ui/Spinner'
import { Text } from '@ui/Text'
import { TokenIcon } from '@ui/TokenIcon'
import { twMerge } from '@ui/twMerge'
import { getMinDurationFmt, getTimeLeftFromNowFmt } from '@utils/dateTools'
import { shortenAddress } from '@utils/formatting'
import BN from 'bn.js'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

interface IPositionCardProps {
  subDaos?: SubDaoWithMeta[]
  position: PositionWithMeta
  className?: string
  onPress: () => void
  unixNow: number
  decimals?: number
  symbol?: string
  image?: string
  loadingMetadata: boolean
  knownProxyName?: string
  loadingText: string | null
  transactionError?: string
}

// A list row. The list fetches the mint, metadata, chain time and proxy
// names once and runs the position actions; the row only renders them.
export const PositionCard = ({
  position,
  subDaos,
  className,
  onPress,
  unixNow,
  decimals,
  symbol,
  image,
  loadingMetadata,
  knownProxyName,
  loadingText,
  transactionError,
}: IPositionCardProps) => {
  const { t } = useTranslation()
  const { lockup, isDelegated, hasGenesisMultiplier, votingMint } = position
  const isConstant = Object.keys(lockup.kind)[0] === 'constant'
  const lockupKindDisplay = isConstant
    ? t('gov.positions.constant')
    : t('gov.positions.decaying')
  const lockedTokens =
    decimals !== undefined
      ? humanReadable(position.amountDepositedNative, decimals)
      : undefined

  // Add status indicators for proxy and delegation
  const showProxyExpiringWarning =
    position.isProxyRenewable && !position.isProxyExpired
  const showProxyExpiredWarning = position.isProxyExpired
  const showDelegationExpiringWarning =
    position.isDelegationRenewable && !position.isDelegationExpired
  const showDelegationExpiredWarning = position.isDelegationExpired

  const delegatedSubDaoMetadata = position.delegatedSubDao
    ? subDaos?.find((sd) => sd.pubkey.equals(position.delegatedSubDao!))
        ?.dntMetadata
    : null

  const isLoading = loadingMetadata || !!loadingText

  const pills = [
    {
      show: showProxyExpiringWarning,
      className: 'bg-warning-500',
      label: t('gov.positions.proxyExpiringSoon'),
    },
    {
      show: showProxyExpiredWarning,
      className: 'bg-destructive',
      label: t('gov.positions.proxyExpired'),
    },
    {
      show: showDelegationExpiringWarning,
      className: 'bg-warning-500',
      label: t('gov.positions.delegationExpiringSoon'),
    },
    {
      show: showDelegationExpiredWarning,
      className: 'bg-destructive',
      label: t('gov.positions.delegationExpired'),
    },
  ].filter((p) => p.show)

  const hasProxy =
    position.proxy && !position.proxy.nextVoter.equals(PublicKey.default)

  if (isLoading) {
    return (
      <View
        className={twMerge('rounded-[12px] bg-secondary p-4 px-8', className)}
      >
        <View className="flex-1 items-center">
          <Text>{loadingText}</Text>
          <View className="mt-3 w-full flex-1 items-center">
            <Spinner />
          </View>
        </View>
      </View>
    )
  }

  return (
    <View className={twMerge('rounded-[12px] bg-secondary', className)}>
      <PressableScale
        testID="PositionCard"
        feedback="opacity"
        onPress={onPress}
      >
        <View className="px-4 py-3">
          <View className="mb-4 flex-row justify-between">
            <View className="flex-row items-center">
              {image ? <TokenIcon size={26} img={image} /> : undefined}
              <Text size="base" className="ml-4 font-medium">
                {`${lockedTokens} ${symbol}`}
              </Text>
            </View>
            {hasGenesisMultiplier && (
              <View className="rounded-md bg-blue-dark-500 p-2 px-4">
                <Text className="text-[10px] text-black">
                  {t('gov.positions.landrush').toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          {pills.length > 0 && (
            <View className="mb-2 flex-row">
              {pills.map((p) => (
                <View
                  key={p.label}
                  className={twMerge('mr-2 rounded-md p-2 px-4', p.className)}
                >
                  <Text className="text-[10px] text-black">
                    {p.label.toUpperCase()}
                  </Text>
                </View>
              ))}
            </View>
          )}
          <View className="flex-row justify-between pb-2">
            <View>
              <Text className="text-muted-foreground">
                {t('gov.positions.lockupType')}
              </Text>
              <Text>{lockupKindDisplay}</Text>
            </View>
            <View>
              <Text className="text-right text-muted-foreground">
                {t('gov.positions.voteMult')}
              </Text>
              <Text className="text-right">
                {(
                  (position.votingPower.isZero()
                    ? 0
                    : // Mul by 100 to get 2 decimal places
                      position.votingPower
                        .mul(new BN(100))
                        .div(position.amountDepositedNative)
                        .toNumber() / 100) /
                  (position.genesisEnd.gt(new BN(unixNow || 0))
                    ? votingMint.genesisVotePowerMultiplier
                    : 1)
                ).toFixed(2)}
              </Text>
            </View>
          </View>
          <View className="flex-row justify-between">
            <View>
              <Text className="text-muted-foreground">
                {isConstant
                  ? t('gov.positions.minDur')
                  : t('gov.positions.timeLeft')}
              </Text>
              <Text>
                {isConstant
                  ? getMinDurationFmt(lockup.startTs, lockup.endTs)
                  : isDelegated
                    ? getTimeLeftFromNowFmt(
                        lockup.endTs.add(new BN(EPOCH_LENGTH)),
                      )
                    : getTimeLeftFromNowFmt(lockup.endTs)}
              </Text>
            </View>
            {hasGenesisMultiplier && (
              <View>
                <Text className="text-right text-muted-foreground">
                  {t('gov.positions.landrush')}
                </Text>
                <Text className="text-right">
                  {votingMint.genesisVotePowerMultiplier}x (
                  {getTimeLeftFromNowFmt(position.genesisEnd)})
                </Text>
              </View>
            )}
          </View>
          <View className="mt-2 flex-row justify-between">
            {delegatedSubDaoMetadata ? (
              <View>
                <Text className="text-muted-foreground">
                  {t('gov.positions.delegatedTo')}
                </Text>
                <View className="mt-2 flex-row items-center justify-center">
                  <View className="rounded-full border-2 border-black">
                    <TokenIcon
                      size={18}
                      img={delegatedSubDaoMetadata.json?.image || ''}
                    />
                  </View>
                  <Text className="ml-2">{delegatedSubDaoMetadata.name}</Text>
                </View>
              </View>
            ) : null}
            {hasProxy ? (
              <View
                className={
                  delegatedSubDaoMetadata ? 'items-end' : 'items-start'
                }
              >
                <Text className="text-muted-foreground">
                  {t('gov.positions.proxiedTo')}
                </Text>
                <View className="mt-2">
                  <Pill
                    color="destructive"
                    text={
                      knownProxyName ||
                      shortenAddress(position.proxy!.nextVoter.toBase58())
                    }
                  />
                </View>
              </View>
            ) : null}
          </View>
        </View>
      </PressableScale>
      {!!transactionError && (
        <View className="w-full flex-1 flex-row justify-center rounded-b-[12px] bg-destructive/10 py-3">
          <View className="mr-2 flex-row self-center">
            <Text className="ml-2 text-[10px] text-destructive">
              {transactionError}
            </Text>
          </View>
        </View>
      )}
    </View>
  )
}
