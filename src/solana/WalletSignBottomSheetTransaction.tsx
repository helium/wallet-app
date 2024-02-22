import Alert from '@assets/images/alert.svg'
import ExternalLink from '@assets/images/externalLink.svg'
import Box from '@components/Box'
import Text from '@components/Text'
import { SusResult, Warning } from '@helium/sus'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import { getMetadata } from '@hooks/useMetaplexMetadata'
import React, { memo, useMemo } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { Image } from 'react-native'
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

  const nonAccountWarnings = useMemo(
    () => transaction.warnings.filter((w) => !w.account),
    [transaction.warnings],
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

  if (transaction.error) {
    return (
      <Box
        p="s"
        flexDirection="column"
        alignItems="stretch"
        borderRadius="l"
        backgroundColor="black500"
      >
        <WarningBox
          header="Simulation Failed"
          body={`${JSON.stringify(transaction.error)}\n${
            transaction.logs
              ? transaction.logs[transaction.logs.length - 1]
              : ''
          }`}
        />
      </Box>
    )
  }

  return (
    <Box flexDirection="column">
      <Box
        flexDirection="column"
        backgroundColor="black500"
        borderTopLeftRadius="l"
        borderTopRightRadius="l"
        padding="s"
      >
        <Box
          flexDirection="row"
          justifyContent="space-between"
          alignItems="stretch"
        >
          <Box flexDirection="row" alignItems="center">
            <Text variant="body1Bold">
              {transaction.writableAccounts.length +
                transaction.possibleCNftChanges.length}
            </Text>
            <Text variant="body1"> {t('browserScreen.accounts')}</Text>
          </Box>
          {nonAccountWarnings.length > 0 ? (
            <Box flexDirection="row" alignItems="center">
              <Box mr="s">
                <Alert width={16} height={16} color="matchaRed500" />
              </Box>
              <Text variant="body3" color="matchaRed500">
                {nonAccountWarnings.length === 1
                  ? nonAccountWarnings[0].shortMessage
                  : `${nonAccountWarnings.length} Warnings`}
              </Text>
            </Box>
          ) : null}
          <Box flexDirection="row" alignItems="center">
            <Text variant="body1">{transactionIdx + 1}</Text>
            <Text variant="body1"> {t('generic.of')} </Text>
            <Text variant="body1">{totalTransactions}</Text>

            <Box alignItems="center" mb="xxs" ml="s">
              <ExternalLink />
            </Box>
          </Box>
        </Box>
        {nonAccountWarnings.length > 0 ? (
          <Box mt="s">
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
      <Box
        mt="xxs"
        flexDirection="column"
        alignItems="stretch"
        borderBottomLeftRadius="l"
        borderBottomRightRadius="l"
        backgroundColor="black500"
      >
        {transaction.writableAccounts
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
          })
          .filter((acc) => !acc.owner || (wallet && acc.owner.equals(wallet)))
          .map((writableAccount) => (
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
        {transaction.possibleCNftChanges.slice(0, 10).map((asset) => (
          <Box key={asset.id} p="s" flexDirection="row" alignItems="center">
            <AssetImage uri={asset.content.json_uri} />
            <Text ml="xs" color="white">
              {asset.content.metadata?.name || 'Unknown cNFT'}
            </Text>
          </Box>
        ))}
      </Box>
    </Box>
  )

  // return (
  //   <Box marginBottom="m" flexDirection="column">
  //     <Box>
  //       {totalTransactions > 1 && (
  //         <Box flexDirection="row">
  //           <Box
  //             borderTopStartRadius="l"
  //             borderTopEndRadius="l"
  //             borderBottomStartRadius="none"
  //             borderBottomEndRadius="none"
  //             backgroundColor="secondaryBackground"
  //             paddingHorizontal="m"
  //             paddingVertical="s"
  //           >
  //             <Text variant="subtitle4" color="secondaryText">
  //               {`${transactionIdx + 1} of ${totalTransactions}`}
  //             </Text>
  //           </Box>
  //         </Box>
  //       )}
  //       {!transaction.rawSimulation && (
  //         <Box
  //           borderTopStartRadius={!(totalTransactions > 1) ? 'l' : 'none'}
  //           borderTopEndRadius="l"
  //           borderBottomColor="black"
  //           borderBottomWidth={1}
  //           backgroundColor="secondaryBackground"
  //           padding="m"
  //         >
  //           <Text variant="body1Medium" color="orange500">
  //             {t('browserScreen.unableToSimulate')}
  //           </Text>
  //         </Box>
  //       )}
  //       {transaction.balanceChanges && (
  //         <Box>
  //           {transaction.balanceChanges.map((change, index) => {
  //             const isFirst = index === 0
  //             const hasBorderStartRadius = !(totalTransactions > 1) && isFirst
  //             const isLast = index === transaction.balanceChanges.length - 1
  //             const isSend = change.amount < 0
  //             let balanceChange
  //             if (change.amount) {
  //               if (change.amount < 0) {
  //                 balanceChange = t('browserScreen.sendToken', {
  //                   ticker: change.metadata.symbol,
  //                   amount: humanReadable(
  //                     new BN(-change.amount.toString()),
  //                     change.metadata.decimals,
  //                   ),
  //                 })
  //               } else {
  //                 balanceChange = t('browserScreen.receiveToken', {
  //                   ticker: change.metadata.symbol,
  //                   amount: humanReadable(
  //                     new BN(change.amount.toString()),
  //                     change.metadata.decimals,
  //                   ),
  //                 })
  //               }
  //             }

  //             return (
  //               <Box
  //                 key={(change.metadata.symbol || '') + (change.amount || '')}
  //                 borderTopStartRadius={hasBorderStartRadius ? 'l' : 'none'}
  //                 borderTopEndRadius={isFirst ? 'l' : 'none'}
  //                 borderBottomStartRadius={isLast ? 'l' : 'none'}
  //                 borderBottomEndRadius={isLast ? 'l' : 'none'}
  //                 backgroundColor="secondaryBackground"
  //                 padding="m"
  //                 borderBottomColor="black"
  //                 borderBottomWidth={isLast ? 0 : 1}
  //               >
  //                 <Text
  //                   variant="body1Medium"
  //                   color={isSend ? 'red500' : 'greenBright500'}
  //                 >
  //                   {balanceChange}
  //                 </Text>
  //               </Box>
  //             )
  //           })}
  //         </Box>
  //       )}
  //       {transaction.solFee && (
  //         <Box
  //           borderBottomStartRadius="l"
  //           borderBottomEndRadius="l"
  //           backgroundColor="secondaryBackground"
  //           padding="m"
  //           flexDirection="column"
  //         >
  //           <Box flexDirection="row">
  //             <Box flexGrow={1}>
  //               <Text variant="body1Medium">
  //                 {t('browserScreen.networkFee')}
  //               </Text>
  //             </Box>
  //             <Text variant="body1Medium" color="secondaryText">
  //               {`~${transaction.solFee / LAMPORTS_PER_SOL} SOL`}
  //             </Text>
  //           </Box>
  //           {typeof transaction.priorityFee !== 'undefined' && (
  //             <Box flexDirection="row">
  //               <Box flexGrow={1} flexDirection="row" alignItems="center">
  //                 <Text variant="body1Medium" mr="s">
  //                   {t('browserScreen.priorityFee')}
  //                 </Text>
  //                 <TouchableOpacity
  //                   onPress={() => setPrioDescriptionVisible((prev) => !prev)}
  //                 >
  //                   <InfoIcon width={15} height={15} />
  //                 </TouchableOpacity>
  //               </Box>
  //               <Text variant="body1Medium" color="secondaryText">
  //                 {`~${humanReadable(new BN(transaction.priorityFee), 9)} SOL`}
  //               </Text>
  //             </Box>
  //           )}
  //           {prioDescriptionVisible && (
  //             <Text mt="s" variant="body2" color="secondaryText">
  //               {t('browserScreen.priorityFeeDescription')}
  //             </Text>
  //           )}
  //         </Box>
  //       )}
  //     </Box>
  //   </Box>
  // )
}

export default memo(WalletSignBottomSheetTransaction)
