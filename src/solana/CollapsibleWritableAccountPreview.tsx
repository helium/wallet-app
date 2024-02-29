import Receive from '@assets/images/receive.svg'
import ChevronDown from '@assets/images/remixChevronDown.svg'
import ChevronUp from '@assets/images/remixChevronUp.svg'
import Send from '@assets/images/send.svg'
import UnknownAccount from '@assets/images/unknownAccount.svg'
import AnchorAccount from '@assets/images/anchorAccount.svg'
import Box from '@components/Box'
import { Pill } from '@components/Pill'
import Text from '@components/Text'
import TokenIcon from '@components/TokenIcon'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import {
  ParsedInstruction,
  RawInstruction,
  Warning,
  WritableAccount,
} from '@helium/sus'
import { getMetadata, useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import { NATIVE_MINT } from '@solana/spl-token'
import { AccountInfo } from '@solana/web3.js'
import { useColors } from '@theme/themeHooks'
import { shortenAddress } from '@utils/formatting'
import { humanReadable } from '@utils/solanaUtils'
import { BN } from 'bn.js'
import React, { useState } from 'react'
import { useAsync } from 'react-async-hook'
import { WritableAccountPreview } from './WritableAccountPreview'

const TokenChange = ({
  symbol,
  image,
}: {
  symbol?: string
  image?: string
}) => {
  return (
    <Box flexDirection="row" alignItems="center">
      <TokenIcon img={image} size={24} />
      <Text ml="xs" color="white">
        {symbol}
      </Text>
    </Box>
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
          ? `${humanReadable(
              bn,
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              writableAccount.metadata!.decimals,
            )}`
          : undefined
      }
      Icon={amount < 0 ? Send : Receive}
      color={amount < 0 ? 'blue' : 'green'}
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
      Icon={amount < 0 ? Send : Receive}
      color={amount < 0 ? 'blue' : 'green'}
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
  const Chevron = expanded ? ChevronUp : ChevronDown
  const { result: metadata } = useAsync(
    async (uri: string | undefined) => getMetadata(uri),
    [writableAccount?.metadata?.uri],
  )
  const { json: solMetadata } = useMetaplexMetadata(NATIVE_MINT)
  const colors = useColors()
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
    <TouchableOpacityBox onPress={() => setExpanded(!expanded)}>
      <Box
        p="s"
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
      >
        <Box flexDirection="row" alignItems="center">
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
            <Box flexDirection="row" alignItems="center">
              {writableAccount.name.startsWith('Unknown') ? (
                <UnknownAccount color="white" width={24} height={24} />
              ) : (
                <AnchorAccount width={24} height={24} />
              )}
              <Text maxWidth={115} ml="xs" color="white" numberOfLines={1}>
                {writableAccount.name}
              </Text>
            </Box>
          )}
          <Text variant="body4" ml="xs" color="grey50">
            {shortenAddress(writableAccount.address.toBase58())}
          </Text>
        </Box>

        <Box flexDirection="row" justifyContent="flex-end" alignItems="center">
          {warnings.length > 0 ? (
            <Box mr="xs">
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
                    ? 'red'
                    : 'orange'
                }
              />
            </Box>
          ) : null}
          {isNative || isToken || created || closed ? (
            <Box mr="xs">
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
                <Pill text="Created" color="green" />
              ) : null}
              {!isToken && !isNative && warnings.length === 0 && closed ? (
                <Pill text="Closed" color="blue" />
              ) : null}
            </Box>
          ) : null}

          <Chevron color={colors.grey500} />
        </Box>
      </Box>
      {expanded ? (
        <WritableAccountPreview
          writableAccount={writableAccount}
          instructions={instructions}
          warnings={warnings}
        />
      ) : null}
    </TouchableOpacityBox>
  )
}
