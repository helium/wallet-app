import {
  ParsedInstruction,
  RawInstruction,
  Warning,
  WritableAccount,
} from '@helium/sus'
import { Text } from '@ui/Text'
import { shortenAddress } from '@utils/formatting'
import { BN } from 'bn.js'
import { ArrowRight } from 'lucide-react-native'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { withUniwind } from 'uniwind'
import { WarningBox } from './WarningBox'

const ArrowIcon = withUniwind(ArrowRight)

type Change = {
  field: string
  preValue: string | null
  postValue: string | null
}

function diff(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  aIn: any | undefined | null,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bIn: any | undefined | null,
  field = '',
): Change[] {
  let a = aIn
  let b = bIn

  if (a?.toBase58) {
    a = shortenAddress(a.toBase58())
  }

  if (b?.toBase58) {
    b = shortenAddress(b.toBase58())
  }

  if (Buffer.isBuffer(a)) {
    a = a.toString('hex')
  }

  if (Buffer.isBuffer(b)) {
    b = b.toString('hex')
  }

  if (BN.isBN(a)) {
    a = a.toString()
  }

  if (BN.isBN(b)) {
    b = b.toString()
  }

  if (a === b) {
    return []
  }

  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)])
    return Array.from(keys).flatMap((key) =>
      diff(a[key], b[key], field ? `${field}.${key}` : key),
    )
  }

  return [
    {
      field: shortenStart(field),
      preValue: shorten(JSON.stringify(a)),
      postValue: shorten(JSON.stringify(b)),
    },
  ]
}

const MAX_LEN = 20
function shorten(str: string) {
  if (str && str.length > MAX_LEN) {
    return `${str.slice(0, MAX_LEN)}...`
  }
  return str
}

function shortenStart(str: string) {
  if (str && str.length > MAX_LEN) {
    return `...${str.slice(str.length - MAX_LEN, str.length)}`
  }
  return str
}

export const WritableAccountPreview = ({
  writableAccount,
  instructions,
  warnings,
}: {
  writableAccount: WritableAccount
  instructions: { parsed?: ParsedInstruction; raw: RawInstruction }[]
  warnings: Warning[]
}) => {
  const { t } = useTranslation()
  const jsonDiff =
    writableAccount.pre.parsed || writableAccount.post.parsed
      ? diff(
          writableAccount.pre.parsed || {},
          writableAccount.post.parsed || {},
        )
      : diff(writableAccount.pre.account, writableAccount.post.account)
  return (
    <View className="flex-col p-2">
      {warnings.map((warning, idx) => (
        <WarningBox
          key={warning.shortMessage + idx}
          header={warning.shortMessage}
          body={warning.message}
        />
      ))}
      <View className="flex-col">
        <View className="flex-row items-stretch justify-between rounded-t-[12px] bg-card p-2">
          <Text size="xs" className="font-bold">
            {t('browserScreen.estimatedAccountChanges')}
          </Text>
        </View>
        <View className="bg-border pt-0.5" />
        <View className="mb-2 flex-col items-stretch rounded-b-[12px] bg-card p-2">
          {writableAccount.pre.account && !writableAccount.post.account && (
            <Text size="xs" className="self-center font-medium">
              {t('browserScreen.accountDeleted')}
            </Text>
          )}
          {!writableAccount.pre.account && writableAccount.post.account && (
            <Text size="xs" className="self-center font-medium">
              {t('browserScreen.accountCreated')}
            </Text>
          )}
          {jsonDiff.map((d) => (
            <View
              key={d.field}
              className="flex-row items-center justify-start overflow-hidden"
            >
              <Text size="xs">{d.field}</Text>
              <View className="grow flex-row flex-wrap items-center justify-end">
                <Text size="xs" className="mr-2 line-through">
                  {d.preValue || 'null'}
                </Text>
                <ArrowIcon size={16} colorClassName="accent-foreground" />
                <Text size="xs" className="ml-2">
                  {d.postValue || 'null'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
      <View className="flex-col">
        <View className="flex-row items-stretch justify-between rounded-t-[12px] bg-card p-2">
          <Text size="xs" className="font-bold">
            {t('browserScreen.instructionsAndPrograms')}
          </Text>
        </View>
        <View className="bg-border pt-0.5" />
        <View className="flex-col items-stretch rounded-b-[12px] bg-card p-2">
          {instructions.map(({ parsed, raw }, index) => (
            <View
              // Not really another unique index
              key={index.toString()}
              className="flex-row items-center justify-between"
            >
              <Text size="xs">{parsed?.name || t('generic.unknown')}</Text>
              <Text size="xs">
                {shortenAddress(raw.programId.toBase58())} (
                {parsed?.programName})
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  )
}
