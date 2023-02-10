import { Provider } from '@coral-xyz/anchor'
import { bulkSendRawTransactions } from '@helium/spl-utils'
import axios from 'axios'
import React, { memo, useCallback, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import 'text-encoding-polyfill'
import AccountIcon from '../../components/AccountIcon'
import { ReAnimatedBox } from '../../components/AnimatedBox'
import Box from '../../components/Box'
import { DelayedFadeIn } from '../../components/FadeInOut'
import IndeterminateProgressBar from '../../components/IndeterminateProgressBar'
import Text from '../../components/Text'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { useAppStorage } from '../../storage/AppStorageProvider'
import { useGetSolanaStatusQuery } from '../../store/slices/solanaStatusApi'
import ButtonPressable from '../../components/ButtonPressable'

async function migrateWallet(
  provider: Provider,
  wallet: string,
  onProgress: (progress: number, total: number) => void,
) {
  let offset = 0
  const limit = 1000
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const url = `https://migration.web.test-helium.com/migrate/${wallet}`
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
  }
}

const SolanaMigration = () => {
  const { currentAccount, anchorProvider } = useAccountStorage()
  // const navigation = useNavigation<TabBarNavigationProp>()
  const { updateL1Network, updateDoneSolanaMigration, doneSolanaMigration } =
    useAppStorage()
  const [retry, updateRetry] = useState(0)

  const { t } = useTranslation()
  const { data: status } = useGetSolanaStatusQuery()

  const [total, setTotal] = useState<number>(0)
  const [progress, setProgress] = useState<number>(0)
  const onProgress = useCallback(
    (p: number, tot: number) => {
      setProgress(p)
      setTotal(tot)
    },
    [setProgress, setTotal],
  )
  const { loading, error } = useAsync(
    async (
      provider: Provider | undefined,
      addr: string | undefined,
      onProg: (progress: number, total: number) => void,
      _: number,
    ) => {
      if (addr && provider) {
        await migrateWallet(provider, addr, onProg)

        doneSolanaMigration.add(addr)
        await updateDoneSolanaMigration(new Set(doneSolanaMigration))
      }
    },
    [anchorProvider, currentAccount?.solanaAddress, onProgress, retry],
  )
  if (error) {
    console.error(error)
  }

  if (!currentAccount) {
    return null
  }

  return (
    <ReAnimatedBox
      entering={DelayedFadeIn}
      flex={1}
      backgroundColor="secondaryBackground"
    >
      <Box
        backgroundColor="transparent"
        flex={1}
        padding="m"
        alignItems="center"
        justifyContent="center"
      >
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
          {!error && !loading && (
            <Animated.View
              style={{ alignItems: 'center' }}
              entering={FadeIn}
              exiting={FadeOut}
            >
              <Text variant="h1Medium" color="white" marginTop="xl">
                {t('solanaMigrationScreen.migrationComplete')}
              </Text>
              <Text
                variant="body2"
                color="secondaryText"
                marginTop="xl"
                numberOfLines={2}
                textAlign="center"
              >
                {t('solanaMigrationScreen.migrationComplete2')}
              </Text>
            </Animated.View>
          )}

          {error && (
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
                {error.message}
              </Text>

              <Box flex={1} width="100%" justifyContent="flex-end">
                {status?.migrationStatus === 'not_started' && (
                  <ButtonPressable
                    marginHorizontal="m"
                    marginBottom="m"
                    height={65}
                    borderRadius="round"
                    backgroundColor="white"
                    backgroundColorOpacity={0.1}
                    backgroundColorOpacityPressed={0.05}
                    titleColorPressedOpacity={0.3}
                    title={t('solanaMigrationScreen.disableSolana')}
                    titleColor="white"
                    onPress={() => updateL1Network('solana')}
                  />
                )}
                <ButtonPressable
                  marginHorizontal="m"
                  marginBottom="m"
                  height={65}
                  borderRadius="round"
                  backgroundColor="white"
                  backgroundColorOpacity={0.1}
                  backgroundColorOpacityPressed={0.05}
                  titleColorPressedOpacity={0.3}
                  title={t('solanaMigrationScreen.retry')}
                  titleColor="white"
                  onPress={() => updateRetry((r) => r + 1)}
                />
              </Box>
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
              >
                {t('solanaMigrationScreen.migrating')}
              </Text>
              <Text
                variant="body0"
                color="grey600"
                textAlign="center"
                marginBottom="m"
                marginTop="s"
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
      </Box>
    </ReAnimatedBox>
  )
}

export default memo(SolanaMigration)
