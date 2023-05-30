import React, { memo, useCallback } from 'react'
import { useNavigation } from '@react-navigation/native'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import 'text-encoding-polyfill'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import BackArrow from '@assets/images/backArrow.svg'
import IndeterminateProgressBar from '@components/IndeterminateProgressBar'
import { DelayedFadeIn } from '@components/FadeInOut'
import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import Text from '@components/Text'
import { ReAnimatedBox } from '@components/AnimatedBox'
import AccountIcon from '@components/AccountIcon'
import { parseTransactionError } from '@utils/solanaUtils'
import { useBalance } from '@utils/Balance'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import sendMail from '@utils/sendMail'
import RNTestFlight from 'react-native-test-flight'
import { Transaction } from '@solana/web3.js'
import { RootState } from '../../store/rootReducer'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { TabBarNavigationProp } from '../../navigation/rootTypes'
import { useSolana } from '../../solana/SolanaProvider'

const ClaimingRewardsScreen = () => {
  const { currentAccount } = useAccountStorage()
  const navigation = useNavigation<TabBarNavigationProp>()
  const { solBalance } = useBalance()
  const { bottom } = useSafeAreaInsets()
  const { cluster, anchorProvider } = useSolana()

  const { t } = useTranslation()
  const solanaPayment = useSelector(
    (reduxState: RootState) => reduxState.solana.payment,
  )

  const onReturn = useCallback(() => {
    // Reset Collectables stack to first screen
    navigation.reset({
      index: 0,
      routes: [{ name: 'Collectables' }],
    })
  }, [navigation])

  const handleSend = useCallback(async () => {
    if (!anchorProvider) return
    const transaction = new Transaction()
    const { blockhash } = await anchorProvider.connection.getLatestBlockhash(
      'recent',
    )

    transaction.recentBlockhash = blockhash
    transaction.feePayer = anchorProvider.wallet.publicKey
    const signedTxn = await anchorProvider.wallet.signTransaction(transaction)
    const body =
      `${solanaPayment?.error?.message}\n\n` +
      `solanaAddress: ${currentAccount?.solanaAddress}\n\n` +
      `cluster: ${cluster}` +
      '\n\n' +
      `anchorProvider Connection: ${anchorProvider?.connection.rpcEndpoint}` +
      '\n\n' +
      `anchorProvider public key: ${anchorProvider?.wallet?.publicKey}` +
      '\n\n' +
      `signature: ${solanaPayment?.signature}` +
      '\n\n' +
      `signedTxn-sig: ${signedTxn?.signature}`
    sendMail({ subject: 'Claim error', body, isHTML: false })
  }, [solanaPayment, anchorProvider, cluster, currentAccount])

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
          {solanaPayment &&
            !solanaPayment.error &&
            !solanaPayment.loading &&
            solanaPayment.signature && (
              <Animated.View
                style={{ alignItems: 'center' }}
                entering={FadeIn}
                exiting={FadeOut}
              >
                <Text variant="h1Medium" color="white" marginTop="xl">
                  {t('collectablesScreen.claimComplete')}
                </Text>
                <Text
                  variant="body2"
                  color="secondaryText"
                  marginTop="xl"
                  numberOfLines={2}
                  textAlign="center"
                >
                  {t('collectablesScreen.claimCompleteBody')}
                </Text>
              </Animated.View>
            )}

          {solanaPayment?.error && (
            <Animated.View
              style={{
                alignItems: 'center',
              }}
              entering={FadeIn}
              exiting={FadeOut}
            >
              <Text
                variant="h1Medium"
                color="white"
                marginTop="xl"
                textAlign="center"
              >
                {t('collectablesScreen.rewardsError')}
              </Text>
              <Text
                variant="body2"
                color="secondaryText"
                marginTop="xl"
                numberOfLines={2}
                textAlign="center"
              >
                {parseTransactionError(
                  solBalance,
                  solanaPayment?.error?.message,
                )}
              </Text>
            </Animated.View>
          )}

          {!solanaPayment && (
            <Animated.View
              style={{ alignItems: 'center' }}
              entering={FadeIn}
              exiting={FadeOut}
            >
              <Text
                textAlign="center"
                variant="h1Medium"
                color="white"
                marginTop="xl"
              >
                {t('collectablesScreen.rewardsError')}
              </Text>
            </Animated.View>
          )}

          {solanaPayment && solanaPayment.loading && (
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
                {t('collectablesScreen.claimingRewards')}
              </Text>
              <Text
                variant="body0"
                color="grey600"
                textAlign="center"
                marginBottom="m"
                marginTop="s"
              >
                {t('collectablesScreen.claimingRewardsBody')}
              </Text>
              <Box flexDirection="row" marginHorizontal="xxl" marginTop="m">
                <IndeterminateProgressBar paddingHorizontal="l" />
              </Box>
            </Animated.View>
          )}

          {(RNTestFlight.isTestFlight || __DEV__) && (
            <ButtonPressable
              marginHorizontal="m"
              marginTop="m"
              height={65}
              borderRadius="round"
              backgroundColor="secondaryBackground"
              backgroundColorOpacity={0.8}
              backgroundColorOpacityPressed={0.9}
              titleColorPressedOpacity={0.9}
              title={t('generic.sendLogs')}
              titleColor="blueBright500"
              onPress={handleSend}
            />
          )}
        </Box>
        <Box
          width="100%"
          justifyContent="flex-end"
          style={{ marginBottom: bottom }}
        >
          <ButtonPressable
            marginHorizontal="m"
            marginBottom="m"
            height={65}
            borderRadius="round"
            backgroundColor="white"
            backgroundColorOpacity={0.1}
            backgroundColorOpacityPressed={0.05}
            titleColorPressedOpacity={0.3}
            title={t('collectablesScreen.returnToCollectables')}
            titleColor="white"
            onPress={onReturn}
            LeadingComponent={
              <BackArrow width={16} height={15} color="white" />
            }
          />
        </Box>
      </Box>
    </ReAnimatedBox>
  )
}

export default memo(ClaimingRewardsScreen)
