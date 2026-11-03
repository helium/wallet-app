import { fullApiContract } from '@helium/blockchain-api'
import { ContractRouterClient } from '@orpc/contract'
import { useNavigation } from '@react-navigation/native'
import { VersionedTransaction } from '@solana/web3.js'
import { useQueryClient } from '@tanstack/react-query'
import { AccountIcon } from '@ui/AccountIcon'
import { Button } from '@ui/Button'
import { Spinner } from '@ui/Spinner'
import { Text } from '@ui/Text'
import { twMerge } from '@ui/twMerge'
import { toTransactionData, hashTagParams } from '@utils/transactionUtils'
import axios from 'axios'
import React, { memo, ReactNode, useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Config from '@utils/config'
import { View } from 'react-native'
import Animated from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { withUniwind } from 'uniwind'
import { FADE_IN, FADE_OUT } from '@theme/motion'
import 'text-encoding-polyfill'
import { refreshHotspots } from '../../hooks/useHotspots'
import { useSolana } from '../../solana/SolanaProvider'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { useAppStorage } from '../../storage/AppStorageProvider'
import { useBlockchainApi } from '../../storage/BlockchainApiProvider'
import * as Logger from '../../utils/logger'
import StepBackHeader from './components/StepBackHeader'

const SafeArea = withUniwind(SafeAreaView)

async function migrateWallet(
  client: ContractRouterClient<typeof fullApiContract>,
  wallet: string,
  onProgress: (progress: number, total: number) => void,
) {
  let offset = 0
  const limit = 1000
  while (true) {
    const url = `${Config.MIGRATION_SERVER_URL}/migrate/${wallet}`
    try {
      const { transactions, count } = (await axios.get(url)).data
      if (count === 0) break
      const txs = transactions.map((tx: number[]) =>
        VersionedTransaction.deserialize(Buffer.from(tx)),
      )
      const paramsHash = hashTagParams({ wallet })
      const tag = `migration-${paramsHash}`
      const transactionData = toTransactionData(txs, {
        tag,
        metadata: { type: 'migration', description: 'Solana Migration' },
      })
      if (transactionData.transactions.length === 0) {
        break
      }
      await client.transactions.submit(transactionData)
      onProgress(offset, count)
      offset += limit
      if (offset > count) {
        break
      }
    } catch (e) {
      Logger.error(e)
      throw e
    }
  }
}

const BackHeader = () => {
  const navigation = useNavigation()
  return <StepBackHeader onBack={navigation.goBack} />
}

// StepBackHeader carries the top inset when it shows, so the safe area then
// skips the top edge.
const Wrapper = ({
  hideBack,
  children,
}: {
  hideBack: boolean
  children: ReactNode
}) => {
  return (
    <SafeArea
      edges={hideBack ? undefined : ['bottom', 'left', 'right']}
      className="flex-1"
    >
      {hideBack ? null : <BackHeader />}
      <View className="flex-1 items-center justify-center p-4">{children}</View>
    </SafeArea>
  )
}

const SolanaMigration = ({
  manual = false,
  hideBack = true,
  className,
}: {
  hideBack?: boolean
  manual?: boolean
  className?: string
}) => {
  const { currentAccount } = useAccountStorage()
  const { anchorProvider } = useSolana()
  const client = useBlockchainApi()
  const {
    updateDoneSolanaMigration,
    doneSolanaMigration,
    updateManualMigration,
  } = useAppStorage()
  const { cluster } = useSolana()
  const [retry, updateRetry] = useState(0)
  const { t } = useTranslation()
  const [total, setTotal] = useState<number>(0)
  const [progress, setProgress] = useState<number>(0)
  const [migrationError, setMigrationError] = useState<string | undefined>()
  const queryClient = useQueryClient()

  const onProgress = useCallback(
    (p: number, tot: number) => {
      setProgress(p)
      setTotal(tot)
    },
    [setProgress, setTotal],
  )

  // Runs the migration, so it is an effect with its own loading and error
  // state rather than a cached query
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error>()
  useEffect(() => {
    const migrate = async () => {
      // if current account is keystone account, then we don't need to migrate
      if (
        !currentAccount?.solanaAddress ||
        currentAccount?.keystoneDevice ||
        !anchorProvider ||
        !cluster ||
        !client ||
        (doneSolanaMigration[cluster]?.includes(
          currentAccount?.solanaAddress,
        ) &&
          !manual)
      )
        return
      // eslint-disable-next-line no-console
      try {
        await migrateWallet(
          client,
          currentAccount?.solanaAddress,
          (p: number, tot: number) => {
            if (current) onProgress(p, tot)
          },
        )

        if (!manual) {
          await updateDoneSolanaMigration({
            cluster,
            address: currentAccount?.solanaAddress,
          })
        }

        void refreshHotspots(queryClient, {
          cluster,
          solanaAddress: currentAccount.solanaAddress,
          anchorProvider,
        })
      } catch (e) {
        Logger.error(e)
        if (current) setMigrationError((e as Error).message)
      }
    }
    // Ignore a run that a newer one replaced, as useAsync did
    let current = true
    // eslint-disable-next-line react-hooks/set-state-in-effect -- shows the loader for the migration this effect starts, as useAsync did
    setLoading(true)
    setError(undefined)
    migrate()
      .catch((e) => current && setError(e))
      .finally(() => current && setLoading(false))
    return () => {
      current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    anchorProvider,
    currentAccount?.solanaAddress,
    onProgress,
    retry,
    cluster,
    queryClient,
    doneSolanaMigration,
    updateDoneSolanaMigration,
    client,
    currentAccount,
    manual,
    updateDoneSolanaMigration,
  ])

  const handleUpdateRetry = useCallback(() => {
    setMigrationError(undefined)
    updateRetry((r) => r + 1)
  }, [])

  const handleManualMigration = useCallback(async () => {
    if (!currentAccount?.solanaAddress || !cluster) return

    await updateManualMigration({
      cluster,
      address: currentAccount?.solanaAddress,
    })
  }, [cluster, updateManualMigration, currentAccount])

  if (error) {
    Logger.error(error)
  }

  if (!currentAccount) {
    return null
  }

  return (
    <View className={twMerge('flex-1 bg-background', className)}>
      <Wrapper hideBack={hideBack}>
        <View className="grow items-center justify-center">
          <View className="shadow-lg">
            <AccountIcon address={currentAccount?.solanaAddress} size={76} />
          </View>
          {!error && !migrationError && !loading && (
            <Animated.View
              style={{ alignItems: 'center' }}
              entering={FADE_IN}
              exiting={FADE_OUT}
            >
              <Text
                size="4xl"
                className="mt-8 font-medium"
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {t('solanaMigrationScreen.migrationComplete')}
              </Text>
              <Text
                className="mt-8 text-center text-muted-foreground"
                numberOfLines={2}
                adjustsFontSizeToFit
              >
                {t('solanaMigrationScreen.migrationComplete2')}
              </Text>
            </Animated.View>
          )}

          {!!(error || migrationError) && (
            <Animated.View
              style={{ alignItems: 'center' }}
              entering={FADE_IN}
              exiting={FADE_OUT}
            >
              <Text size="4xl" className="mt-8 text-center font-medium">
                {t('solanaMigrationScreen.error')}
              </Text>
              <Text
                className="mt-8 text-center text-muted-foreground"
                numberOfLines={2}
              >
                {error?.message || migrationError}
              </Text>
            </Animated.View>
          )}

          {loading && (
            <Animated.View
              style={{ alignItems: 'center' }}
              entering={FADE_IN}
              exiting={FADE_OUT}
            >
              <Text
                size="4xl"
                className="mt-8 text-center font-medium"
                numberOfLines={2}
                adjustsFontSizeToFit
              >
                {t('solanaMigrationScreen.migrating')}
              </Text>
              <Text
                size="xl"
                className="mb-4 mt-2 text-center text-muted-foreground"
                numberOfLines={2}
                adjustsFontSizeToFit
              >
                {t('solanaMigrationScreen.migratingBody')}
              </Text>
              <Spinner size="large" className="mt-4" />
              {total > 200 && (
                <Text
                  size="xl"
                  className="mb-4 mt-2 text-center text-muted-foreground"
                >
                  {progress} / {total}
                </Text>
              )}
            </Animated.View>
          )}
        </View>

        {!!(error || migrationError) && (
          <View className="absolute inset-x-0 bottom-0 mx-4 mb-6 flex-row items-end justify-center gap-4">
            {retry > 0 && (
              <Button
                variant="secondary"
                size="dashboard"
                className="flex-1"
                onPress={() =>
                  void handleManualMigration().catch(console.error)
                }
              >
                {t('solanaMigrationScreen.migrateLater')}
              </Button>
            )}
            <Button
              variant="secondary"
              size="dashboard"
              className="flex-1"
              onPress={handleUpdateRetry}
            >
              {t('solanaMigrationScreen.retry')}
            </Button>
          </View>
        )}
      </Wrapper>
    </View>
  )
}

export default memo(SolanaMigration)
