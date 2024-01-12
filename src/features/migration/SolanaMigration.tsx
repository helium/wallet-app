import { Provider } from '@coral-xyz/anchor'
import { bulkSendRawTransactions } from '@helium/spl-utils'
import axios from 'axios'
import React, { memo, ReactNode, useCallback, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import 'text-encoding-polyfill'
import { BoxProps } from '@shopify/restyle'
import AccountIcon from '@components/AccountIcon'
import { ReAnimatedBox } from '@components/AnimatedBox'
import Box from '@components/Box'
import { DelayedFadeIn } from '@components/FadeInOut'
import IndeterminateProgressBar from '@components/IndeterminateProgressBar'
import Text from '@components/Text'
import ButtonPressable from '@components/ButtonPressable'
import BackScreen from '@components/BackScreen'
import { Theme } from '@theme/theme'
import Config from 'react-native-config'
import SafeAreaBox from '@components/SafeAreaBox'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { useAppStorage } from '../../storage/AppStorageProvider'
import * as Logger from '../../utils/logger'
import { useAppDispatch } from '../../store/store'
import { fetchHotspots } from '../../store/slices/hotspotsSlice'
import { useSolana } from '../../solana/SolanaProvider'

async function migrateWallet(
  provider: Provider,
  wallet: string,
  onProgress: (progress: number, total: number) => void,
) {
  let offset = 0
  const limit = 1000
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const url = `${Config.MIGRATION_SERVER_URL}/migrate/${wallet}`
    try {
      // eslint-disable-next-line no-await-in-loop
      const { transactions, count } = (await axios.get(url)).data
      const txs = transactions.map(Buffer.from)
      // eslint-disable-next-line no-await-in-loop
      await bulkSendRawTransactions(provider.connection, txs)
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

const SolanaMigration = ({
  manual = false,
  hideBack = true,
  ...props
}: BoxProps<Theme> & { hideBack?: boolean; manual?: boolean }) => {
  const { currentAccount } = useAccountStorage()
  const { anchorProvider } = useSolana()
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
  const dispatch = useAppDispatch()

  const onProgress = useCallback(
    (p: number, tot: number) => {
      setProgress(p)
      setTotal(tot)
    },
    [setProgress, setTotal],
  )

  const { loading, error } = useAsync(async () => {
    if (
      !currentAccount?.solanaAddress ||
      !anchorProvider ||
      !cluster ||
      (doneSolanaMigration[cluster]?.includes(currentAccount?.solanaAddress) &&
        !manual)
    )
      return

    try {
      await migrateWallet(
        anchorProvider,
        currentAccount?.solanaAddress,
        onProgress,
      )

      if (!manual) {
        await updateDoneSolanaMigration({
          cluster,
          address: currentAccount?.solanaAddress,
        })
      }

      dispatch(
        fetchHotspots({
          anchorProvider,
          account: currentAccount,
          cluster,
        }),
      )
    } catch (e) {
      Logger.error(e)
      setMigrationError((e as Error).message)
    }
  }, [
    anchorProvider,
    currentAccount?.solanaAddress,
    onProgress,
    retry,
    cluster,
    dispatch,
    doneSolanaMigration,
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

  const Wrapper = ({ children }: { children: ReactNode }) => {
    const boxProps = {
      backgroundColor: 'transparent',
      flex: 1,
      padding: 'm',
      alignItems: 'center',
      justifyContent: 'center',
    } as BoxProps<Theme>

    if (hideBack) {
      return <SafeAreaBox {...boxProps}>{children}</SafeAreaBox>
    }
    return <BackScreen {...boxProps}>{children}</BackScreen>
  }

  return (
    <ReAnimatedBox
      entering={DelayedFadeIn}
      flex={1}
      backgroundColor="secondaryBackground"
      {...props}
    >
      <Wrapper>
        <Box flexGrow={1} justifyContent="center" alignItems="center">
          <Box
            shadowColor="black"
            shadowOpacity={0.4}
            shadowOffset={{ width: 0, height: 10 }}
            shadowRadius={10}
            elevation={12}
          >
            <AccountIcon address={currentAccount?.solanaAddress} size={76} />
          </Box>
          {!error && !migrationError && !loading && (
            <Animated.View
              style={{ alignItems: 'center' }}
              entering={FadeIn}
              exiting={FadeOut}
            >
              <Text
                variant="h1Medium"
                color="white"
                marginTop="xl"
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {t('solanaMigrationScreen.migrationComplete')}
              </Text>
              <Text
                variant="body2"
                color="secondaryText"
                marginTop="xl"
                numberOfLines={2}
                textAlign="center"
                adjustsFontSizeToFit
              >
                {t('solanaMigrationScreen.migrationComplete2')}
              </Text>
            </Animated.View>
          )}

          {(error || migrationError) && (
            <Animated.View
              style={{ alignItems: 'center' }}
              entering={FadeIn}
              exiting={FadeOut}
            >
              <Text
                variant="h1Medium"
                color="white"
                marginTop="xl"
                textAlign="center"
              >
                {t('solanaMigrationScreen.error')}
              </Text>
              <Text
                variant="body2"
                color="secondaryText"
                marginTop="xl"
                numberOfLines={2}
                textAlign="center"
              >
                {error?.message || migrationError}
              </Text>
            </Animated.View>
          )}

          {loading && (
            <Animated.View
              style={{ alignItems: 'center' }}
              entering={FadeIn}
              exiting={FadeOut}
            >
              <Text
                variant="h1Medium"
                color="white"
                marginTop="xl"
                textAlign="center"
                numberOfLines={2}
                adjustsFontSizeToFit
              >
                {t('solanaMigrationScreen.migrating')}
              </Text>
              <Text
                variant="body0"
                color="grey600"
                textAlign="center"
                marginBottom="m"
                marginTop="s"
                numberOfLines={2}
                adjustsFontSizeToFit
              >
                {t('solanaMigrationScreen.migratingBody')}
              </Text>
              <Box flexDirection="row" marginHorizontal="xxl" marginTop="m">
                <IndeterminateProgressBar paddingHorizontal="l" />
              </Box>
              {total > 200 && (
                <Text
                  variant="body0"
                  color="grey600"
                  textAlign="center"
                  marginBottom="m"
                  marginTop="s"
                >
                  {progress} / {total}
                </Text>
              )}
            </Animated.View>
          )}
        </Box>

        {(error || migrationError) && (
          <Box
            flexDirection="row"
            marginBottom="l"
            marginHorizontal="m"
            position="absolute"
            bottom={0}
            left={0}
            right={0}
            alignItems="flex-end"
            justifyContent="center"
          >
            {retry > 0 && (
              <ButtonPressable
                flex={1}
                marginStart="m"
                marginBottom="m"
                height={65}
                borderRadius="round"
                backgroundColor="white"
                backgroundColorOpacity={0.1}
                backgroundColorOpacityPressed={0.05}
                titleColorPressedOpacity={0.3}
                title={t('solanaMigrationScreen.migrateLater')}
                titleColor="white"
                onPress={handleManualMigration}
              />
            )}
            <ButtonPressable
              flex={1}
              marginStart="m"
              marginBottom="m"
              height={65}
              borderRadius="round"
              backgroundColor="white"
              backgroundColorOpacity={0.1}
              backgroundColorOpacityPressed={0.05}
              titleColorPressedOpacity={0.3}
              title={t('solanaMigrationScreen.retry')}
              titleColor="white"
              onPress={handleUpdateRetry}
            />
          </Box>
        )}
      </Wrapper>
    </ReAnimatedBox>
  )
}

export default memo(SolanaMigration)
