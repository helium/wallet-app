import AnchorAccount from '@assets/images/anchorAccount.svg'
import { Pill } from '@ui/Pill'
import {
  ParsedInstruction,
  RawInstruction,
  Warning,
  WritableAccount,
} from '@helium/sus'
import { getMetadata, useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import { NATIVE_MINT } from '@solana/spl-token'
import { AccountInfo } from '@solana/web3.js'
import { PressableScale } from '@ui/PressableScale'
import { Text } from '@ui/Text'
import { TokenIcon } from '@ui/TokenIcon'
import { shortenAddress } from '@utils/formatting'
import { humanReadable } from '@utils/solanaUtils'
import { BN } from 'bn.js'
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  CircleHelp,
} from 'lucide-react-native'
import React, { useState } from 'react'
import { View } from 'react-native'
import { withUniwind } from 'uniwind'
import { useQuery } from '@tanstack/react-query'
import { WritableAccountPreview } from './WritableAccountPreview'

const ChevronDownIcon = withUniwind(ChevronDown)
const ChevronUpIcon = withUniwind(ChevronUp)
const UnknownAccountIcon = withUniwind(CircleHelp)

const TokenChange = ({
  symbol,
  image,
}: {
  symbol?: string
  image?: string
}) => {
  return (
    <View className="flex-row items-center">
      <TokenIcon img={image} size={24} />
      <Text className="ml-1">{symbol}</Text>
    </View>
  )
}

const TokenBalanceChange = ({
  writableAccount,
  showText = true,
}: {
  writableAccount: WritableAccount
  showText?: boolean
}) => {
  const amount =
    ((writableAccount.post.parsed?.amount as bigint) || BigInt(0)) -
    ((writableAccount.pre.parsed?.amount as bigint) || BigInt(0))
  const bn =
    amount < 0 ? new BN((-amount).toString()) : new BN(amount.toString())
  if (bn.isZero()) {
    return null
  }
  return (
    <Pill
      text={
        showText
          ? `${humanReadable(bn, writableAccount.metadata!.decimals)}`
          : undefined
      }
      Icon={amount < 0 ? ArrowUpRight : ArrowDownLeft}
      color={amount < 0 ? 'info' : 'success'}
    />
  )
}

const NativeSolBalanceChange = ({
  writableAccount,
}: {
  writableAccount: WritableAccount
}) => {
  const amount = BigInt(
    (writableAccount.post.account?.lamports || 0) -
      (writableAccount.pre.account?.lamports || 0),
  )
  const bn =
    amount < 0 ? new BN((-amount).toString()) : new BN(amount.toString())
  return (
    <Pill
      text={`${humanReadable(bn, 9)}`}
      Icon={amount < 0 ? ArrowUpRight : ArrowDownLeft}
      color={amount < 0 ? 'info' : 'success'}
    />
  )
}

function accountExists(account: AccountInfo<Buffer> | null): boolean {
  return account ? account.lamports > 0 : false
}

export const CollapsibleWritableAccountPreview = ({
  writableAccount,
  instructions,
  warnings,
}: {
  writableAccount: WritableAccount
  instructions: { parsed?: ParsedInstruction; raw: RawInstruction }[]
  warnings: Warning[]
}) => {
  const [expanded, setExpanded] = useState(false)
  const Chevron = expanded ? ChevronUpIcon : ChevronDownIcon
  const { data: metadata } = useQuery({
    queryKey: ['metadataJson', writableAccount?.metadata?.uri],
    queryFn: async () =>
      (await getMetadata(writableAccount?.metadata?.uri)) ?? null,
  })
  const { json: solMetadata } = useMetaplexMetadata(NATIVE_MINT)
  const isNative = writableAccount.name === 'Native SOL Account'
  const isToken =
    writableAccount.metadata &&
    (writableAccount.pre.type === 'TokenAccount' ||
      writableAccount.post.type === 'TokenAccount')

  const created =
    !accountExists(writableAccount.pre.account) &&
    accountExists(writableAccount.post.account)
  const closed =
    accountExists(writableAccount.pre.account) &&
    !accountExists(writableAccount.post.account)

  return (
    <PressableScale
      feedback="opacity"
      onPress={() => setExpanded((prev) => !prev)}
    >
      <View className="flex-row items-center justify-between p-2">
        <View className="flex-row items-center">
          {writableAccount.metadata ? (
            <TokenChange
              symbol={
                writableAccount.name.includes('Mint')
                  ? writableAccount.name
                  : writableAccount.metadata.symbol
              }
              image={metadata?.image}
            />
          ) : isNative ? (
            <TokenChange symbol="SOL" image={solMetadata.image} />
          ) : (
            <View className="flex-row items-center">
              {writableAccount.name.startsWith('Unknown') ? (
                <UnknownAccountIcon
                  size={24}
                  colorClassName="accent-foreground"
                />
              ) : (
                <AnchorAccount width={24} height={24} />
              )}
              <Text className="ml-1 max-w-[115px]" numberOfLines={1}>
                {writableAccount.name}
              </Text>
            </View>
          )}
          <Text className="ml-1 text-[10px] text-muted-foreground">
            {shortenAddress(writableAccount.address.toBase58())}
          </Text>
        </View>

        <View className="flex-row items-center justify-end">
          {warnings.length > 0 ? (
            <View className="mr-1">
              <Pill
                text={
                  warnings.length > 1
                    ? `${warnings.length} Warnings`
                    : warnings[0].shortMessage === 'Unchanged'
                      ? 'Unknown Changes'
                      : warnings[0].shortMessage
                }
                color={
                  warnings.some((w) => w.severity === 'critical')
                    ? 'destructive'
                    : 'warning'
                }
              />
            </View>
          ) : null}
          {isNative || isToken || created || closed ? (
            <View className="mr-1">
              {isToken ? (
                <TokenBalanceChange
                  showText={warnings.length === 0}
                  writableAccount={writableAccount}
                />
              ) : null}
              {isNative ? (
                <NativeSolBalanceChange writableAccount={writableAccount} />
              ) : null}
              {!isToken && !isNative && warnings.length === 0 && created ? (
                <Pill text="Created" color="success" />
              ) : null}
              {!isToken && !isNative && warnings.length === 0 && closed ? (
                <Pill text="Closed" color="info" />
              ) : null}
            </View>
          ) : null}

          <Chevron size={16} colorClassName="accent-muted-foreground" />
        </View>
      </View>
      {expanded ? (
        <WritableAccountPreview
          writableAccount={writableAccount}
          instructions={instructions}
          warnings={warnings}
        />
      ) : null}
    </PressableScale>
  )
}
