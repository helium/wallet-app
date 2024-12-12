import ArrowRight from '@assets/svgs/remixArrowRight.svg'
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
    <Box flexDirection="column" p="2">
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
          backgroundColor="cardBackground"
          borderTopLeftRadius="2xl"
          borderTopRightRadius="2xl"
          padding="2"
        >
          <Text color="primaryText" variant="textXsBold">
            {t('browserScreen.estimatedAccountChanges')}
          </Text>
        </Box>
        <Box pt="0.5" backgroundColor="primaryBackground" />
        <Box
          p="2"
          mb="2"
          flexDirection="column"
          alignItems="stretch"
          borderBottomLeftRadius="2xl"
          borderBottomRightRadius="2xl"
          backgroundColor="cardBackground"
        >
          {writableAccount.pre.account && !writableAccount.post.account && (
            <Text variant="textXsMedium" color="primaryText" alignSelf="center">
              {t('browserScreen.accountDeleted')}
            </Text>
          )}
          {!writableAccount.pre.account && writableAccount.post.account && (
            <Text variant="textXsMedium" color="primaryText" alignSelf="center">
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
              <Text variant="textXsRegular" color="primaryText">
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
                  variant="textXsRegular"
                  mr="2"
                  textDecorationLine="line-through"
                  color="primaryText"
                >
                  {d.preValue || 'null'}
                </Text>
                <ArrowRight />
                <Text variant="textXsRegular" ml="2" color="primaryText">
                  {d.postValue || 'null'}
                </Text>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
      <Box flexDirection="column">
        <Box
          p="2"
          flexDirection="row"
          justifyContent="space-between"
          alignItems="stretch"
          backgroundColor="cardBackground"
          borderTopLeftRadius="2xl"
          borderTopRightRadius="2xl"
          padding="2"
        >
          <Text color="primaryText" variant="textXsBold">
            {t('browserScreen.instructionsAndPrograms')}
          </Text>
        </Box>
        <Box pt="0.5" backgroundColor="primaryBackground" />
        <Box
          p="2"
          flexDirection="column"
          alignItems="stretch"
          borderBottomLeftRadius="2xl"
          borderBottomRightRadius="2xl"
          backgroundColor="cardBackground"
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
              <Text variant="textXsRegular" color="primaryText">
                {parsed?.name || t('generic.unknown')}
              </Text>
              <Text variant="textXsRegular" color="primaryText">
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
