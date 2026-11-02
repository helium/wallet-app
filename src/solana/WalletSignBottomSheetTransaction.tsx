import { Pill } from '@ui/Pill'
import { SusResult, Warning } from '@helium/sus'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import { getMetadata } from '@hooks/useMetaplexMetadata'
import { Image } from '@ui/Image'
import { PressableScale } from '@ui/PressableScale'
import { Text } from '@ui/Text'
import {
  ChevronDown,
  ChevronUp,
  CircleHelp,
  ExternalLink,
  TriangleAlert,
} from 'lucide-react-native'
import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Linking, View } from 'react-native'
import { withUniwind } from 'uniwind'
import { CollapsibleWritableAccountPreview } from './CollapsibleWritableAccountPreview'
import { WarningBox } from './WarningBox'

const AlertIcon = withUniwind(TriangleAlert)
const ChevronDownIcon = withUniwind(ChevronDown)
const ChevronUpIcon = withUniwind(ChevronUp)
const ExternalLinkIcon = withUniwind(ExternalLink)
const UnknownAccountIcon = withUniwind(CircleHelp)

const AssetImage = ({ uri }: { uri: string }) => {
  const { data: metadata } = useQuery({
    queryKey: ['metadataJson', uri],
    queryFn: async () => (await getMetadata(uri)) ?? null,
  })
  return <Image className="size-6" source={{ uri: metadata?.image }} />
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
  const Chevron = expanded ? ChevronUpIcon : ChevronDownIcon

  const nonAccountWarnings = transaction.warnings.filter((w) => !w.account)
  const [errorsCollapsed, setErrorsCollapsed] = useState(
    transaction.possibleCNftChanges.length <= 10 &&
      !nonAccountWarnings.some((w) => w.severity === 'critical'),
  )
  const warningsByAccount = transaction.warnings.reduce(
    (acc, warning) => {
      if (warning.account) {
        const key = warning.account.toBase58()
        if (!acc[key]) acc[key] = []
        acc[key].push(warning)
      }
      return acc
    },
    {} as Record<string, Warning[]>,
  )

  // Collapse non-token accounts with unchanged warning
  const [collapsedAccounts, uncollapsedAccounts] = splitArray(
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
          acca.pre.type === 'TokenAccount' || acca.post.type === 'TokenAccount'
        const bIsToken =
          accb.pre.type === 'TokenAccount' || accb.post.type === 'TokenAccount'

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

  return (
    <View className="mb-4 flex-col">
      <View className="flex-col rounded-t-[12px] bg-secondary p-2">
        <View className="flex-row items-stretch justify-between">
          <View className="flex-row items-center">
            <Text size="base" className="font-bold">
              {uncollapsedAccounts.length + collapsedAccounts.length}
            </Text>
            <Text size="base"> {t('browserScreen.accounts')}</Text>
          </View>
          {nonAccountWarnings.length > 0 ? (
            <PressableScale
              feedback="opacity"
              onPress={() => setErrorsCollapsed((prev) => !prev)}
              className="flex-row items-center"
            >
              <View className="mr-2">
                <AlertIcon size={16} colorClassName="accent-destructive" />
              </View>
              <Text size="xs" className="text-destructive">
                {nonAccountWarnings.length === 1
                  ? nonAccountWarnings[0].shortMessage
                  : `${nonAccountWarnings.length} Warnings`}
              </Text>
            </PressableScale>
          ) : null}
          <View className="flex-row items-center">
            <Text size="base">{transactionIdx + 1}</Text>
            <Text size="base"> {t('generic.of')} </Text>
            <Text size="base">{totalTransactions}</Text>

            <PressableScale
              feedback="opacity"
              className="mb-0.5 ml-2 items-center"
              onPress={() =>
                void Linking.openURL(transaction.explorerLink).catch(
                  console.error,
                )
              }
            >
              <ExternalLinkIcon
                size={16}
                colorClassName="accent-muted-foreground"
              />
            </PressableScale>
          </View>
        </View>
        {!transaction.error &&
        nonAccountWarnings.length > 0 &&
        !errorsCollapsed ? (
          <View className="mt-2">
            {nonAccountWarnings.map((warning, idx) => (
              <WarningBox
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
          </View>
        ) : null}
      </View>
      {transaction.error ? (
        <View className="mt-0.5 flex-col items-stretch rounded-b-[12px] bg-secondary p-2">
          <WarningBox
            header="Simulation Failed"
            body={`${JSON.stringify(transaction.error)}\n${
              Array.isArray(transaction.logs)
                ? transaction.logs.some((log) =>
                    log.includes('SlippageToleranceExceeded'),
                  )
                  ? t('browserScreen.slippageToleranceExceeded')
                  : transaction.logs.slice(-3).join('\n')
                : ''
            }`}
          />
        </View>
      ) : (
        <View className="mt-0.5 flex-col items-stretch rounded-b-[12px] bg-secondary">
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
              <PressableScale
                feedback="opacity"
                onPress={() => setExpanded(!expanded)}
              >
                <View className="flex-row items-center justify-between p-2">
                  <View className="flex-row items-center">
                    <View className="flex-row items-center">
                      <UnknownAccountIcon
                        size={24}
                        colorClassName="accent-foreground"
                      />
                    </View>
                    <Text className="ml-1">
                      {collapsedAccounts.length} {t('browserScreen.accounts')}
                    </Text>
                  </View>
                  <View className="flex-row items-center justify-end">
                    <View className="mr-1">
                      <Pill text="Unknown Changes" color="warning" />
                    </View>
                    <Chevron
                      size={16}
                      colorClassName="accent-muted-foreground"
                    />
                  </View>
                </View>
              </PressableScale>
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
          {Array.isArray(transaction.possibleCNftChanges) &&
            transaction.possibleCNftChanges.slice(0, 10).map((asset) => (
              <View key={asset.id} className="flex-row items-center p-2">
                <AssetImage uri={asset.content.json_uri} />
                <Text className="ml-1">
                  {asset.content.metadata?.name || 'Unknown cNFT'}
                </Text>
              </View>
            ))}
        </View>
      )}
    </View>
  )
}

export default WalletSignBottomSheetTransaction
