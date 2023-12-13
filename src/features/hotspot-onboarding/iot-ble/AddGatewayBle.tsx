import BackScreen from '@components/BackScreen'
import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import CircleLoader from '@components/CircleLoader'
import RadioButton from '@components/RadioButton'
import Text from '@components/Text'
import {
  init,
  iotInfoKey,
  keyToAssetKey,
  rewardableEntityConfigKey,
} from '@helium/helium-entity-manager-sdk'
import {
  AddGatewayV1,
  useHotspotBle,
  useOnboarding,
} from '@helium/react-native-sdk'
import {
  IOT_MINT,
  bufferToTransaction,
  sendAndConfirmWithRetry,
  truthy,
} from '@helium/spl-utils'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import { useImplicitBurn } from '@hooks/useImplicitBurn'
import { useOnboardingBalnces } from '@hooks/useOnboardingBalances'
import { useNavigation } from '@react-navigation/native'
import { LAMPORTS_PER_SOL, Transaction } from '@solana/web3.js'
import { useAccountStorage } from '@storage/AccountStorageProvider'
import { DAO_KEY, IOT_SUB_DAO_KEY } from '@utils/constants'
import sleep from '@utils/sleep'
import { getHotspotWithRewards, isInsufficientBal } from '@utils/solanaUtils'
import BN from 'bn.js'
import { Buffer } from 'buffer'
import React, { useState } from 'react'
import { useAsync, useAsyncCallback } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { Alert, Linking, ScrollView } from 'react-native'
import { useSolana } from '../../../solana/SolanaProvider'
import { CollectableNavigationProp } from '../../collectables/collectablesTypes'

const REQUIRED_SOL = new BN((0.00089088 + 0.00001) * LAMPORTS_PER_SOL)
const AddGatewayBle = () => {
  const { onboardingClient, getOnboardTransactions } = useOnboarding()
  const { getOnboardingAddress, createGatewayTxn } = useHotspotBle()
  const { currentAccount } = useAccountStorage()
  const { anchorProvider } = useSolana()
  const { t } = useTranslation()
  const collectNav = useNavigation<CollectableNavigationProp>()
  const wallet = useCurrentWallet()
  const {
    result: onboardAddress,
    error: fetchOnboardAddrError,
    loading: fetchLoading,
  } = useAsync(async () => {
    const onboardAddr = await getOnboardingAddress()
    // For testing
    // const onboardAddr = getTestHotspot().address.b58
    return onboardAddr
  }, [getOnboardingAddress])
  const {
    error: onboardBalError,
    maker,
    loadingMaker,
    mySol,
    makerDc,
    loadingMakerSol,
    loadingMySol,
    myDcWithHnt,
    loadingMyDc,
    makerSol,
    loadingMakerDc,
    onboardingDcRequirements,
    locationAssertDcRequirements,
    loadingOnboardingDcRequirements,
  } = useOnboardingBalnces(onboardAddress)
  const requiredDc = onboardingDcRequirements[IOT_MINT.toBase58()] || new BN(0)
  const assertRequiredDc =
    locationAssertDcRequirements[IOT_MINT.toBase58()] || new BN(0)
  const insufficientMakerSolBal =
    !loadingMakerSol && (makerSol || new BN(0)).lt(REQUIRED_SOL)
  const insufficientMakerDcBal =
    !loadingMakerDc &&
    !loadingOnboardingDcRequirements &&
    (makerDc || new BN(0)).lt(requiredDc)
  const insufficientMySolBal =
    !loadingMySol && (mySol || new BN(0)).lt(REQUIRED_SOL)
  const insufficientMyDcBal =
    !loadingOnboardingDcRequirements &&
    !loadingMyDc &&
    (myDcWithHnt || new BN(0)).lt(requiredDc)

  const { implicitBurn } = useImplicitBurn()

  // eslint-disable-next-line no-nested-ternary
  const balError = maker
    ? // eslint-disable-next-line no-nested-ternary
      insufficientMakerSolBal
      ? new Error(
          t('hotspotOnboarding.onboarding.manufacturerMissingSol', {
            name: maker?.name,
          }),
        )
      : insufficientMakerDcBal
      ? new Error(
          t('hotspotOnboarding.onboarding.manufacturerMissingDc', {
            name: maker?.name,
          }),
        )
      : undefined
    : undefined

  const {
    execute: handleAddGateway,
    loading: callbackLoading,
    error: callbackError,
  } = useAsyncCallback(async () => {
    if (!anchorProvider) {
      Alert.alert('Error', 'No anchor provider')
      return
    }
    const accountAddress = currentAccount?.address
    if (!accountAddress || !wallet) {
      Alert.alert(
        'Error',
        'You must first add a wallet address from the main menu',
      )
      return
    }

    if (!maker || !maker.address) {
      throw new Error(t('hotspotOnboarding.onboarding.makerNotFound'))
    }
    const payer = balError ? wallet?.toBase58() : undefined

    // For testing
    // const tx = await new AddGatewayV1({
    //   owner: Address.fromB58(accountAddress),
    //   gateway: getTestHotspot().address,
    //   payer: Address.fromB58(maker.address),
    // }).sign({
    //   gateway: getTestHotspot(),
    // })
    // const txnStr = tx.toString()
    const txnStr = await createGatewayTxn({
      ownerAddress: accountAddress,
      payerAddress: maker.address,
    })
    const tx = AddGatewayV1.fromString(txnStr)
    if (!tx?.gateway) {
      throw new Error('Invalid transaction')
    }
    // const txnStr = await createGatewayTxn({
    //   ownerAddress: accountAddress,
    //   payerAddress: maker?.address,
    // })
    // const tx = AddGatewayV1.fromStr()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function wrapProgramError(e: any) {
      if (isInsufficientBal(e)) {
        throw new Error(
          t('hotspotOnboarding.onboarding.manufacturerMissingDcOrSol', {
            name: maker?.name,
          }),
        )
      }
      if (e.InstructionError) {
        throw new Error(`Program Error: ${JSON.stringify(e)}`)
      }
      throw e
    }

    const createTxns = await onboardingClient.createHotspot({
      transaction: txnStr,
    })

    const createHotspotTxns = createTxns.data?.solanaTransactions?.map(
      (createHotspotTx) => Buffer.from(createHotspotTx),
    )
    try {
      // eslint-disable-next-line no-restricted-syntax
      for (const txn of createHotspotTxns || []) {
        // eslint-disable-next-line no-await-in-loop
        await sendAndConfirmWithRetry(
          anchorProvider.connection,
          txn,
          {
            skipPreflight: false,
          },
          'confirmed',
        )
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      wrapProgramError(e)
    }

    const hemProgram = await init(anchorProvider)
    const [iotConfigKey] = rewardableEntityConfigKey(IOT_SUB_DAO_KEY, 'IOT')
    const iotInfo = await hemProgram.account.iotHotspotInfoV0.fetchNullable(
      iotInfoKey(iotConfigKey, tx?.gateway?.b58)[0],
    )
    if (!iotInfo && onboardAddress) {
      // Implicit burn to DC if needed
      if (payer) {
        await implicitBurn(requiredDc.toNumber())
      }

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const { solanaTransactions } = await getOnboardTransactions({
        hotspotAddress: onboardAddress,
        payer,
        networkDetails: [{ hotspotType: 'IOT' }],
      })

      let solanaSignedTransactions: Transaction[] | undefined

      if (solanaTransactions) {
        solanaSignedTransactions =
          await anchorProvider?.wallet.signAllTransactions(
            solanaTransactions.map((txn) => {
              return bufferToTransaction(Buffer.from(txn, 'base64'))
            }),
          )
      }

      if (solanaSignedTransactions) {
        try {
          // eslint-disable-next-line no-restricted-syntax
          for (const txn of solanaSignedTransactions) {
            // eslint-disable-next-line no-await-in-loop
            await sendAndConfirmWithRetry(
              anchorProvider.connection,
              txn.serialize(),
              {
                skipPreflight: true,
              },
              'confirmed',
            )
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (e: any) {
          wrapProgramError(e)
        }
      }
    }

    const keyToAssetK = keyToAssetKey(DAO_KEY, tx.gateway.b58, 'b58')[0]
    let totalTime = 0
    let keyToAsset = await hemProgram.account.keyToAssetV0.fetchNullable(
      keyToAssetK,
    )
    // Wait up to 30s for hotspot to exist
    while (!keyToAsset && totalTime < 30 * 1000) {
      // eslint-disable-next-line no-await-in-loop
      await sleep(2000)
      totalTime += 2000
      // eslint-disable-next-line no-await-in-loop
      keyToAsset = await hemProgram.account.keyToAssetV0.fetchNullable(
        keyToAssetK,
      )
    }
    if (!keyToAsset) {
      throw new Error(t('hotspotOnboarding.onboarding.failedToFind'))
    }
    const { asset } = keyToAsset
    const collectable = await getHotspotWithRewards(asset, anchorProvider)
    collectNav.navigate(
      iotInfo ? 'HotspotDetailsScreen' : 'AssertLocationScreen',
      { collectable },
    )
  })
  const error =
    fetchOnboardAddrError ||
    onboardBalError ||
    callbackError ||
    (!maker &&
      !loadingMaker &&
      new Error(t('hotspotOnboarding.onboarding.makerNotFound')))
  const loading =
    fetchLoading ||
    callbackLoading ||
    loadingMakerDc ||
    loadingMakerSol ||
    loadingMyDc ||
    loadingMySol ||
    loadingOnboardingDcRequirements
  const disabled =
    loading || (balError && (insufficientMyDcBal || insufficientMySolBal))
  const [selectedOption, setSelectedOption] = useState<'contact' | 'pay'>(
    'contact',
  )
  const usd = requiredDc.toNumber() / 100000
  const assertUsd = assertRequiredDc.toNumber() / 100000

  return (
    <BackScreen title={t('hotspotOnboarding.onboarding.title')}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <Text
          marginTop="m"
          marginBottom="m"
          variant="subtitle1"
          color="secondaryText"
          textAlign="left"
          adjustsFontSizeToFit
        >
          {t('hotspotOnboarding.onboarding.subtitle')}
        </Text>
        {error && (
          <Text variant="body1Medium" color="red500">
            {error.message ? error.message.toString() : error.toString()}
          </Text>
        )}
        {balError && (
          <>
            <Text variant="body1Medium" color="red500">
              {t('hotspotOnboarding.onboarding.responsible')}
            </Text>
            <Text mt="s" variant="body1Medium" color="red500">
              {t('hotspotOnboarding.onboarding.manufacturerMissing', {
                name: maker?.name,
                tokens: `${[
                  insufficientMakerDcBal && 'DC',
                  insufficientMakerSolBal && 'SOL',
                ]
                  .filter(truthy)
                  .join(' and ')}`,
              })}
            </Text>
            <Text mt="s" variant="body1Medium" color="red500">
              {t('hotspotOnboarding.onboarding.twoSolutions')}
            </Text>
            <Box
              pl="s"
              flexDirection="column"
              alignItems="flex-start"
              justifyContent="flex-start"
            >
              <RadioButton
                label={t('hotspotOnboarding.onboarding.optionContact')}
                selected={selectedOption === 'contact'}
                onClick={() => setSelectedOption('contact')}
              />
              <RadioButton
                label={t('hotspotOnboarding.onboarding.optionPay', {
                  usd,
                  assertUsd,
                })}
                selected={selectedOption === 'pay'}
                onClick={() => setSelectedOption('pay')}
              />
            </Box>

            {selectedOption === 'contact' && (
              <ButtonPressable
                marginTop="l"
                borderRadius="round"
                titleColor="black"
                borderColor="transparent"
                backgroundColor="white"
                title={t('hotspotOnboarding.onboarding.contact')}
                onPress={async () => {
                  const url = `https://docs.helium.com/hotspot-makers/#${maker?.name.toLowerCase()}`
                  const supported = await Linking.canOpenURL(url)
                  if (supported) {
                    Linking.openURL(url)
                  } else {
                    Alert.alert(`Don't know how to open URL: ${url}`)
                  }
                }}
              />
            )}

            {selectedOption === 'pay' && (
              <>
                {!callbackLoading && insufficientMySolBal && (
                  <Text mt="s" variant="body1Medium" color="red500">
                    {t('hotspotOnboarding.onboarding.notEnoughSol')}
                  </Text>
                )}
                {!callbackLoading && insufficientMyDcBal && (
                  <Text mt="s" variant="body1Medium" color="red500">
                    {t('hotspotOnboarding.onboarding.notEnoughDc')}
                  </Text>
                )}
                {(callbackLoading ||
                  (!insufficientMySolBal && !insufficientMyDcBal)) && (
                  <>
                    <Text
                      fontWeight="bold"
                      mt="s"
                      variant="body1Medium"
                      color="red500"
                    >
                      {t('hotspotOnboarding.onboarding.pay', {
                        usd,
                        assertUsd,
                      })}
                    </Text>
                    <ButtonPressable
                      marginTop="l"
                      borderRadius="round"
                      titleColor="black"
                      borderColor="transparent"
                      opacity={disabled ? 0.5 : undefined}
                      backgroundColor="red500"
                      title={
                        loading
                          ? undefined
                          : t('hotspotOnboarding.onboarding.onboardAndPay')
                      }
                      onPress={handleAddGateway}
                      disabled={disabled}
                      LeadingComponent={loading ? <CircleLoader /> : undefined}
                    />
                  </>
                )}
              </>
            )}
          </>
        )}
        {!balError && maker && (
          <ButtonPressable
            marginTop="l"
            borderRadius="round"
            titleColor="black"
            borderColor="transparent"
            opacity={disabled ? 0.5 : undefined}
            backgroundColor="white"
            title={t('hotspotOnboarding.onboarding.onboard')}
            onPress={handleAddGateway}
            disabled={disabled}
            LeadingComponent={loading ? <CircleLoader /> : undefined}
          />
        )}
      </ScrollView>
    </BackScreen>
  )
}

export default AddGatewayBle
