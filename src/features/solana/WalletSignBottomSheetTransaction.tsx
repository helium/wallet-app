import Alert from '@assets/svgs/alert.svg'
import ExternalLink from '@assets/svgs/externalLink.svg'
import ChevronDown from '@assets/svgs/remixChevronDown.svg'
import ChevronUp from '@assets/svgs/remixChevronUp.svg'
import UnknownAccount from '@assets/svgs/unknownAccount.svg'
import Box from '@components/Box'
import { Pill } from '@components/Pill'
import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { SusResult, Warning } from '@helium/sus'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import { getMetadata } from '@hooks/useMetaplexMetadata'
import React, { memo, useMemo, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { Image, Linking } from 'react-native'
import { CollapsibleWritableAccountPreview } from './CollapsibleWritableAccountPreview'
import { WarningBox } from './WarningBox'

const AssetImage = ({ uri }: { uri: string }) => {
  const { result: metadata } = useAsync(() => getMetadata(uri), [uri])
  return (
    <Image
      style={{ height: 24, width: 24 }}
      source={{
        uri: metadata?.image,
        cache: 'force-cache',
      }}
    />
  )
}

function splitArray<T>(arr: T[], predicate: (item: T) => boolean): [T[], T[]] {
  return arr.reduce(
    ([pass, fail], item) => {
      return predicate(item) ? [[...pass, item], fail] : [pass, [...fail, item]]
    },
    [[], []] as [T[], T[]],
  )
}

const WalletSignBottomSheetTransaction = ({
  transaction,
  transactionIdx,
  totalTransactions,
}: {
  transaction: SusResult
  transactionIdx: number
  totalTransactions: number
}) => {
  const { t } = useTranslation()
  const wallet = useCurrentWallet()
  const [expanded, setExpanded] = useState(false)
  const Chevron = expanded ? ChevronUp : ChevronDown

  const nonAccountWarnings = useMemo(
    () => transaction.warnings.filter((w) => !w.account),
    [transaction.warnings],
  )
  const [errorsCollapsed, setErrorsCollapsed] = useState(
    transaction.possibleCNftChanges.length <= 10 &&
      !nonAccountWarnings.some((w) => w.severity === 'critical'),
  )
  const warningsByAccount = useMemo(() => {
    return transaction.warnings.reduce((acc, warning) => {
      if (warning.account) {
        acc[warning.account.toBase58()] ||= []
        acc[warning.account.toBase58()].push(warning)
      }
      return acc
    }, {} as Record<string, Warning[]>)
  }, [transaction])

  // Collapse non-token accounts with unchanged warning
  const [collapsedAccounts, uncollapsedAccounts] = useMemo(() => {
    return splitArray(
      transaction.writableAccounts
        .filter((acc) => !acc.owner || (wallet && acc.owner.equals(wallet)))
        .sort((acca, accb) => {
          if (warningsByAccount[acca.address.toBase58()]?.length > 0) {
            return -1
          }

          if (warningsByAccount[accb.address.toBase58()]?.length > 0) {
            return 1
          }

          const aIsSol = acca.name === 'Native SOL Account'
          const bIsSol = accb.name === 'Native SOL Account'
          if (aIsSol && !bIsSol) {
            return -1
          }

          if (!aIsSol && bIsSol) {
            return 1
          }

          const aIsToken =
            acca.pre.type === 'TokenAccount' ||
            acca.post.type === 'TokenAccount'
          const bIsToken =
            accb.pre.type === 'TokenAccount' ||
            accb.post.type === 'TokenAccount'

          if (aIsToken && !bIsToken) {
            return -1
          }

          if (!aIsToken && bIsToken) {
            return 1
          }

          return 0
        }),
      (wa) =>
        warningsByAccount[wa.address.toBase58()]?.some(
          (warning) => warning.shortMessage === 'Unchanged',
        ) && !wa.metadata,
    )
  }, [transaction.writableAccounts, warningsByAccount, wallet])

  return (
    <Box flexDirection="column" marginBottom="4">
      <Box
        flexDirection="column"
        backgroundColor="cardBackground"
        borderTopLeftRadius="2xl"
        borderTopRightRadius="2xl"
        padding="2"
      >
        <Box
          flexDirection="row"
          justifyContent="space-between"
          alignItems="stretch"
        >
          <Box flexDirection="row" alignItems="center">
            <Text variant="textMdBold" color="primaryText">
              {uncollapsedAccounts.length + collapsedAccounts.length}
            </Text>
            <Text variant="textMdSemibold" color="primaryText">
              {' '}
              {t('browserScreen.accounts')}
            </Text>
          </Box>
          {nonAccountWarnings.length > 0 ? (
            <TouchableOpacityBox
              onPress={() => setErrorsCollapsed((prev) => !prev)}
              flexDirection="row"
              alignItems="center"
            >
              <Box mr="2">
                <Alert width={16} height={16} color="error.500" />
              </Box>
              <Text variant="textXsRegular" color="error.500">
                {nonAccountWarnings.length === 1
                  ? nonAccountWarnings[0].shortMessage
                  : `${nonAccountWarnings.length} Warnings`}
              </Text>
            </TouchableOpacityBox>
          ) : null}
          <Box flexDirection="row" alignItems="center">
            <Text variant="textMdRegular" color="primaryText">
              {transactionIdx + 1}
            </Text>
            <Text variant="textMdRegular" color="secondaryText">
              {' '}
              {t('generic.of')}{' '}
            </Text>
            <Text variant="textMdRegular" color="primaryText">
              {totalTransactions}
            </Text>

            <TouchableOpacityBox
              alignItems="center"
              mb="0.5"
              ml="2"
              onPress={() => Linking.openURL(transaction.explorerLink)}
            >
              <ExternalLink />
            </TouchableOpacityBox>
          </Box>
        </Box>
        {!transaction.error &&
        nonAccountWarnings.length > 0 &&
        !errorsCollapsed ? (
          <Box mt="2">
            {nonAccountWarnings.map((warning, idx) => (
              <WarningBox
                // eslint-disable-next-line react/no-array-index-key
                key={warning.shortMessage + idx}
                header={warning.shortMessage}
                body={warning.message}
              />
            ))}
            {transaction.possibleCNftChanges.length > 10 ? (
              <WarningBox
                header="Many cNFTs Updateable"
                body="More than 10 cNFTs (or Hotspots) could be changed by this transaction."
              />
            ) : null}
          </Box>
        ) : null}
      </Box>
      {transaction.error ? (
        <Box
          p="2"
          flexDirection="column"
          alignItems="stretch"
          borderBottomLeftRadius="2xl"
          borderBottomRightRadius="2xl"
          backgroundColor="cardBackground"
          mt="0.5"
        >
          <WarningBox
            header="Simulation Failed"
            body={`${JSON.stringify(transaction.error)}\n${
              transaction.logs
                ? transaction.logs.some((log) =>
                    log.includes('SlippageToleranceExceeded'),
                  )
                  ? t('browserScreen.slippageToleranceExceeded')
                  : transaction.logs.slice(-3).join('\n')
                : ''
            }`}
          />
        </Box>
      ) : (
        <Box
          mt="0.5"
          flexDirection="column"
          alignItems="stretch"
          borderBottomLeftRadius="2xl"
          borderBottomRightRadius="2xl"
          backgroundColor="cardBackground"
        >
          {uncollapsedAccounts.map((writableAccount) => (
            <CollapsibleWritableAccountPreview
              key={writableAccount.address.toBase58()}
              writableAccount={writableAccount}
              instructions={transaction.instructions.filter((ix) =>
                ix.raw.accounts.some((a) =>
                  a.pubkey.equals(writableAccount.address),
                ),
              )}
              warnings={
                warningsByAccount[writableAccount.address.toBase58()] || []
              }
            />
          ))}
          {collapsedAccounts.length > 0 ? (
            <>
              <TouchableOpacityBox onPress={() => setExpanded(!expanded)}>
                <Box
                  p="2"
                  flexDirection="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Box flexDirection="row" alignItems="center">
                    <Box flexDirection="row" alignItems="center">
                      <UnknownAccount
                        color="primaryText"
                        width={24}
                        height={24}
                      />
                    </Box>
                    <Text variant="textSmRegular" ml="xs" color="primaryText">
                      {collapsedAccounts.length} {t('browserScreen.accounts')}
                    </Text>
                  </Box>
                  <Box
                    flexDirection="row"
                    justifyContent="flex-end"
                    alignItems="center"
                  >
                    <Box mr="xs">
                      <Pill text="Unknown Changes" color="orange" />
                    </Box>
                    <Chevron color="gray.500" />
                  </Box>
                </Box>
              </TouchableOpacityBox>
              {expanded
                ? collapsedAccounts.map((writableAccount) => (
                    <CollapsibleWritableAccountPreview
                      key={writableAccount.address.toBase58()}
                      writableAccount={writableAccount}
                      instructions={transaction.instructions.filter((ix) =>
                        ix.raw.accounts.some((a) =>
                          a.pubkey.equals(writableAccount.address),
                        ),
                      )}
                      warnings={
                        warningsByAccount[writableAccount.address.toBase58()] ||
                        []
                      }
                    />
                  ))
                : null}
            </>
          ) : null}
          {transaction.possibleCNftChanges.slice(0, 10).map((asset) => (
            <Box key={asset.id} p="2" flexDirection="row" alignItems="center">
              <AssetImage uri={asset.content.json_uri} />
              <Text variant="textSmRegular" ml="xs" color="primaryText">
                {asset.content.metadata?.name || 'Unknown cNFT'}
              </Text>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  )
}

export default memo(WalletSignBottomSheetTransaction)
