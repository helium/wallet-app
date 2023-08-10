import React, { memo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Box from '@components/Box'
import Text from '@components/Text'
import { useSimulatedTransaction } from '@hooks/useSimulatedTransaction'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import CircleLoader from '@components/CircleLoader'
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
  incrementTotalSolFee: (fee: number) => void
  setNestedInsufficentFunds: React.Dispatch<React.SetStateAction<boolean>>
}) => {
  const { anchorProvider } = useSolana()
  const { t } = useTranslation()
  const { loading, balanceChanges, solFee, insufficientFunds } =
    useSimulatedTransaction(transaction, anchorProvider?.publicKey)

  useEffect(() => {
    if (solFee) {
      incrementTotalSolFee(solFee)
    }
  }, [solFee, incrementTotalSolFee])

  useEffect(() => {
    if (insufficientFunds) {
      setNestedInsufficentFunds(true)
    }
  }, [insufficientFunds, setNestedInsufficentFunds])

  return (
    <Box marginBottom="m">
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
                      amount: change.nativeChange,
                    })
                  } else {
                    balanceChange = t('browserScreen.receiveToken', {
                      ticker: change.symbol,
                      amount: change.nativeChange,
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
              flexDirection="row"
            >
              <Box flexGrow={1}>
                <Text variant="body1Medium">
                  {t('browserScreen.networkFee')}
                </Text>
              </Box>
              <Text variant="body1Medium" color="secondaryText">
                {`~${solFee / LAMPORTS_PER_SOL} SOL`}
              </Text>
            </Box>
          )}
        </Box>
      )}
    </Box>
  )
}

export default memo(WalletSignBottomSheetTransaction)
