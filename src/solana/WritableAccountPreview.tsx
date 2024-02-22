import ArrowRight from '@assets/images/remixArrowRight.svg'
import Box from '@components/Box'
import Text from '@components/Text'
import {
  ParsedInstruction,
  RawInstruction,
  Warning,
  WritableAccount,
} from '@helium/sus'
import { shortenAddress } from '@utils/formatting'
import { BN } from 'bn.js'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { WarningBox } from './WarningBox'

type Change = {
  field: string
  preValue: string | null
  postValue: string | null
}

function diff(
  aIn: any | undefined | null,
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
    <Box flexDirection="column" p="s">
      {warnings.map((warning, idx) => (
        <WarningBox
          // eslint-disable-next-line react/no-array-index-key
          key={warning.shortMessage + idx}
          header={warning.shortMessage}
          body={warning.message}
        />
      ))}
      <Box flexDirection="column">
        <Box
          flexDirection="row"
          justifyContent="space-between"
          alignItems="stretch"
          backgroundColor="black650"
          borderTopLeftRadius="l"
          borderTopRightRadius="l"
          padding="s"
        >
          <Text color="white" variant="body3Bold">
            {t('browserScreen.estimatedAccountChanges')}
          </Text>
        </Box>
        <Box pt="xxs" backgroundColor="black" />
        <Box
          p="s"
          mb="s"
          flexDirection="column"
          alignItems="stretch"
          borderBottomLeftRadius="l"
          borderBottomRightRadius="l"
          backgroundColor="black650"
        >
          {writableAccount.pre.account && !writableAccount.post.account && (
            <Text variant="body3Medium" color="white" alignSelf="center">
              {t('browserScreen.accountDeleted')}
            </Text>
          )}
          {!writableAccount.pre.account && writableAccount.post.account && (
            <Text variant="body3Medium" color="white" alignSelf="center">
              {t('browserScreen.accountCreated')}
            </Text>
          )}
          {jsonDiff.map((d) => (
            <Box
              key={d.field}
              flexDirection="row"
              alignItems="center"
              justifyContent="flex-start"
              overflow="hidden"
            >
              <Text variant="body3" color="white">
                {d.field}
              </Text>
              <Box
                flexGrow={1}
                flexDirection="row"
                alignItems="center"
                justifyContent="flex-end"
                flexWrap="wrap"
              >
                <Text
                  variant="body3"
                  mr="s"
                  textDecorationLine="line-through"
                  color="white"
                >
                  {d.preValue || 'null'}
                </Text>
                <ArrowRight />
                <Text variant="body3" ml="s" color="white">
                  {d.postValue || 'null'}
                </Text>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
      <Box flexDirection="column">
        <Box
          p="s"
          flexDirection="row"
          justifyContent="space-between"
          alignItems="stretch"
          backgroundColor="black650"
          borderTopLeftRadius="l"
          borderTopRightRadius="l"
          padding="s"
        >
          <Text color="white" variant="body3Bold">
            {t('browserScreen.instructionsAndPrograms')}
          </Text>
        </Box>
        <Box pt="xxs" backgroundColor="black" />
        <Box
          p="s"
          flexDirection="column"
          alignItems="stretch"
          borderBottomLeftRadius="l"
          borderBottomRightRadius="l"
          backgroundColor="black650"
        >
          {instructions.map(({ parsed, raw }, index) => (
            <Box
              // Not really another unique index
              // eslint-disable-next-line react/no-array-index-key
              key={index.toString()}
              flexDirection="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Text variant="body3" color="white">
                {parsed?.name || t('generic.unknown')}
              </Text>
              <Text variant="body3" color="white">
                {shortenAddress(raw.programId.toBase58())} (
                {parsed?.programName})
              </Text>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  )
}
