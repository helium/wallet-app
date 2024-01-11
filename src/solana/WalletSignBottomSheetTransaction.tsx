import InfoIcon from '@assets/images/info.svg'
import Box from '@components/Box'
import CircleLoader from '@components/CircleLoader'
import Text from '@components/Text'
import { useSimulatedTransaction } from '@hooks/useSimulatedTransaction'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import BN from 'bn.js'
import React, { memo, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TouchableOpacity } from 'react-native'
import { humanReadable } from '../utils/solanaUtils'
import { useSolana } from './SolanaProvider'

const WalletSignBottomSheetTransaction = ({
  transaction,
  transactionIdx,
  totalTransactions,
  incrementTotalSolFee,
  setNestedInsufficentFunds,
}: {
  transaction: Buffer
  transactionIdx: number
  totalTransactions: number
  incrementTotalSolFee: (idx: number, fee: number) => void
  setNestedInsufficentFunds: React.Dispatch<React.SetStateAction<boolean>>
}) => {
  const { anchorProvider } = useSolana()
  const { t } = useTranslation()
  const { loading, balanceChanges, solFee, priorityFee, insufficientFunds } =
    useSimulatedTransaction(transaction, anchorProvider?.publicKey)

  const [prioDescriptionVisible, setPrioDescriptionVisible] = useState(false)

  useEffect(() => {
    if (solFee) {
      incrementTotalSolFee(transactionIdx, solFee + (priorityFee || 0))
    }
  }, [priorityFee, solFee, transactionIdx, incrementTotalSolFee])

  useEffect(() => {
    if (insufficientFunds) {
      setNestedInsufficentFunds(true)
    }
  }, [insufficientFunds, setNestedInsufficentFunds])

  return (
    <Box marginBottom="m" flexDirection="column">
      {loading && (
        <Box
          borderRadius="l"
          backgroundColor="secondaryBackground"
          padding="m"
          borderBottomColor="black"
          borderBottomWidth={1}
          flexDirection="row"
          justifyContent="center"
        >
          <CircleLoader loaderSize={30} />
        </Box>
      )}
      {!loading && (
        <Box>
          {totalTransactions > 1 && (
            <Box flexDirection="row">
              <Box
                borderTopStartRadius="l"
                borderTopEndRadius="l"
                borderBottomStartRadius="none"
                borderBottomEndRadius="none"
                backgroundColor="secondaryBackground"
                paddingHorizontal="m"
                paddingVertical="s"
              >
                <Text variant="subtitle4" color="secondaryText">
                  {`${transactionIdx + 1} of ${totalTransactions}`}
                </Text>
              </Box>
            </Box>
          )}
          {!balanceChanges && (
            <Box
              borderTopStartRadius={!(totalTransactions > 1) ? 'l' : 'none'}
              borderTopEndRadius="l"
              borderBottomColor="black"
              borderBottomWidth={1}
              backgroundColor="secondaryBackground"
              padding="m"
            >
              <Text variant="body1Medium" color="orange500">
                {t('browserScreen.unableToSimulate')}
              </Text>
            </Box>
          )}
          {balanceChanges && (
            <Box>
              {balanceChanges.map((change, index) => {
                const isFirst = index === 0
                const hasBorderStartRadius = !(totalTransactions > 1) && isFirst
                const isLast = index === balanceChanges.length - 1 && !solFee
                const isSend = change.type === 'send'
                let balanceChange
                if (change.nativeChange) {
                  if (change.type === 'send') {
                    balanceChange = t('browserScreen.sendToken', {
                      ticker: change.symbol,
                      amount: change.nativeChange.toLocaleString('fullwide', {
                        useGrouping: false,
                        maximumSignificantDigits: 20,
                      }),
                    })
                  } else {
                    balanceChange = t('browserScreen.receiveToken', {
                      ticker: change.symbol,
                      amount: change.nativeChange.toLocaleString('fullwide', {
                        useGrouping: false,
                        maximumSignificantDigits: 20,
                      }),
                    })
                  }
                }

                return (
                  <Box
                    key={(change.symbol || '') + (change.nativeChange || '')}
                    borderTopStartRadius={hasBorderStartRadius ? 'l' : 'none'}
                    borderTopEndRadius={isFirst ? 'l' : 'none'}
                    borderBottomStartRadius={isLast ? 'l' : 'none'}
                    borderBottomEndRadius={isLast ? 'l' : 'none'}
                    backgroundColor="secondaryBackground"
                    padding="m"
                    borderBottomColor="black"
                    borderBottomWidth={isLast ? 0 : 1}
                  >
                    <Text
                      variant="body1Medium"
                      color={isSend ? 'red500' : 'greenBright500'}
                    >
                      {balanceChange}
                    </Text>
                  </Box>
                )
              })}
            </Box>
          )}
          {solFee && (
            <Box
              borderBottomStartRadius="l"
              borderBottomEndRadius="l"
              backgroundColor="secondaryBackground"
              padding="m"
              flexDirection="column"
            >
              <Box flexDirection="row">
                <Box flexGrow={1}>
                  <Text variant="body1Medium">
                    {t('browserScreen.networkFee')}
                  </Text>
                </Box>
                <Text variant="body1Medium" color="secondaryText">
                  {`~${solFee / LAMPORTS_PER_SOL} SOL`}
                </Text>
              </Box>
              {typeof priorityFee !== 'undefined' && (
                <Box flexDirection="row">
                  <Box flexGrow={1} flexDirection="row" alignItems="center">
                    <Text variant="body1Medium" mr="s">
                      {t('browserScreen.priorityFee')}
                    </Text>
                    <TouchableOpacity
                      onPress={() => setPrioDescriptionVisible((prev) => !prev)}
                    >
                      <InfoIcon width={15} height={15} />
                    </TouchableOpacity>
                  </Box>
                  <Text variant="body1Medium" color="secondaryText">
                    {`~${humanReadable(new BN(priorityFee), 9)} SOL`}
                  </Text>
                </Box>
              )}
              {prioDescriptionVisible && (
                <Text mt="s" variant="body2" color="secondaryText">
                  {t('browserScreen.priorityFeeDescription')}
                </Text>
              )}
            </Box>
          )}
        </Box>
      )}
    </Box>
  )
}

export default memo(WalletSignBottomSheetTransaction)
