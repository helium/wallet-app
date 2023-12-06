import BackScreen from '@components/BackScreen'
import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import CircleLoader from '@components/CircleLoader'
import RadioButton from '@components/RadioButton'
import Text from '@components/Text'
import Address from '@helium/address'
import { init as initDataCredits } from '@helium/data-credits-sdk'
import {
  init,
  iotInfoKey,
  keyToAssetKey,
  rewardableEntityConfigKey,
} from '@helium/helium-entity-manager-sdk'
import { useOwnedAmount, useSolOwnedAmount } from '@helium/helium-react-hooks'
import { Maker } from '@helium/onboarding'
import {
  AddGatewayV1,
  useHotspotBle,
  useOnboarding,
} from '@helium/react-native-sdk'
import {
  DC_MINT,
  HNT_MINT,
  bufferToTransaction,
  heliumAddressToSolAddress,
  sendAndConfirmWithRetry,
  truthy,
} from '@helium/spl-utils'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import { usePublicKey } from '@hooks/usePublicKey'
import { useSubDao } from '@hooks/useSubDao'
import { useNavigation } from '@react-navigation/native'
import {
  createAssociatedTokenAccountIdempotentInstruction,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token'
import { Transaction } from '@solana/web3.js'
import { useAccountStorage } from '@storage/AccountStorageProvider'
import { useBalance } from '@utils/Balance'
import { DAO_KEY, IOT_SUB_DAO_KEY } from '@utils/constants'
import { getHotspotWithRewards, isInsufficientBal } from '@utils/solanaUtils'
import BN from 'bn.js'
import { Buffer } from 'buffer'
import React, { useMemo, useState } from 'react'
import { useAsync, useAsyncCallback } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { Alert, Linking, ScrollView } from 'react-native'
import { useSolana } from '../../../solana/SolanaProvider'
import { useWalletSign } from '../../../solana/WalletSignProvider'
import { WalletStandardMessageTypes } from '../../../solana/walletSignBottomSheetTypes'
import { CollectableNavigationProp } from '../../collectables/collectablesTypes'
import { getTestHotspot } from './Settings'

type MakerInfo = {
  maker?: Maker
  onboardAddress?: string
}

const AddGatewayBle = () => {
  const { getOnboardingRecord, onboardingClient, getOnboardTransactions } =
    useOnboarding()
  const { getOnboardingAddress } = useHotspotBle()
  const { currentAccount } = useAccountStorage()
  const { anchorProvider } = useSolana()
  const { walletSignBottomSheetRef } = useWalletSign()
  const { t } = useTranslation()
  const collectNav = useNavigation<CollectableNavigationProp>()
  const {
    result: { onboardAddress, maker } = {} as MakerInfo,
    error: fetchRecordError,
    loading: fetchLoading,
  } = useAsync(async () => {
    // const onboardAddr = await getOnboardingAddress()
    // TODO: Disable when debug done
    const onboardAddr = getTestHotspot().address.b58
    const onboardRecord = await getOnboardingRecord(onboardAddr)
    if (!onboardRecord) {
      throw new Error(
        t('hotspotOnboarding.onboarding.hotspotNotFound', {
          onboardAddress,
        }),
      )
    }

    return {
      onboardAddress: onboardAddr,
      maker: onboardRecord.maker,
    } as MakerInfo
  }, [getOnboardingRecord, getOnboardingAddress])
  const makerSolAddr = useMemo(
    () => maker && heliumAddressToSolAddress(maker.address),
    [maker],
  )

  const { amount: makerDc, loading: loadingMakerDc } = useOwnedAmount(
    usePublicKey(makerSolAddr),
    DC_MINT,
  )
  const wallet = useCurrentWallet()
  const { amount: myDc, loading: loadingMyDc } = useOwnedAmount(wallet, DC_MINT)
  const { amount: myHnt, loading: loadingMyHnt } = useOwnedAmount(
    wallet,
    HNT_MINT,
  )
  const { networkTokensToDc } = useBalance()
  const myTotalDc =
    typeof myDc !== 'undefined' && typeof myHnt !== 'undefined'
      ? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        new BN(myDc!.toString()).add(
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          networkTokensToDc(new BN(myHnt!.toString()))!.div(new BN(100000000)),
        )
      : undefined
  const loadingDc = loadingMyDc || loadingMakerDc || loadingMyHnt
  const { info: subDao } = useSubDao(IOT_SUB_DAO_KEY.toBase58(), true)
  // NOTE: This only works for IOT subdao. Which is what this was built for so that's fine.
  const totalDcReq = subDao?.onboardingDcFee
  const { amount: makerSol, loading: loadingMakerSol } = useSolOwnedAmount(
    usePublicKey(makerSolAddr),
  )
  const { amount: mySol, loading: loadingMySol } = useSolOwnedAmount(
    usePublicKey(makerSolAddr),
  )
  const loadingSol = loadingMakerSol || loadingMySol
  const insufficientMakerSolBal =
    !loadingSol &&
    typeof makerSol !== 'undefined' &&
    makerSol < 0.00089088 + 0.00001
  const insufficientMakerDcBal =
    !loadingDc &&
    totalDcReq &&
    typeof makerDc !== 'undefined' &&
    makerDc < totalDcReq.toNumber()
  const insufficientMySolBal =
    !loadingSol && typeof mySol !== 'undefined' && mySol < 0.00089088 + 0.00001
  const insufficientMyDcBal =
    !loadingDc &&
    totalDcReq &&
    typeof myTotalDc !== 'undefined' &&
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    myTotalDc!.toNumber() < totalDcReq.toNumber()

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

    // TODO: Undo when done testing
    const tx = await new AddGatewayV1({
      owner: Address.fromB58(accountAddress),
      gateway: getTestHotspot().address,
      payer: Address.fromB58(maker.address),
    }).sign({
      gateway: getTestHotspot(),
    })
    const txnStr = tx.toString()
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
      if (payer && (myDc || 0) < totalDcReq.toNumber()) {
        const program = await initDataCredits(anchorProvider)
        const dcDeficit = BigInt(totalDcReq.toNumber()) - (myDc || BigInt(0))
        const burnTx = new Transaction({
          feePayer: wallet,
          recentBlockhash: (
            await anchorProvider.connection.getLatestBlockhash()
          ).blockhash,
        })
        burnTx.add(
          await program.methods
            .mintDataCreditsV0({
              hntAmount: null,
              dcAmount: new BN(dcDeficit.toString()),
            })
            .preInstructions([
              createAssociatedTokenAccountIdempotentInstruction(
                wallet,
                getAssociatedTokenAddressSync(DC_MINT, wallet, true),
                wallet,
                DC_MINT,
              ),
            ])
            .accounts({
              dcMint: DC_MINT,
              recipient: wallet,
            })
            .instruction(),
        )
        if (!walletSignBottomSheetRef) {
          throw new Error('No wallet bottom sheet')
        }
        const decision = await walletSignBottomSheetRef.show({
          type: WalletStandardMessageTypes.signTransaction,
          url: '',
          serializedTxs: [burnTx.serialize({ requireAllSignatures: false })],
          header: t('transactions.buyDc'),
        })
        const signed = await anchorProvider.wallet.signTransaction(burnTx)
        const serializedTx = Buffer.from(signed.serialize())
        if (decision) {
          await sendAndConfirmWithRetry(
            anchorProvider.connection,
            serializedTx,
            { skipPreflight: true },
            'confirmed',
          )
        } else {
          throw new Error('User rejected transaction')
        }
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
    const keyToAsset = await hemProgram.account.keyToAssetV0.fetch(keyToAssetK)
    const { asset } = keyToAsset
    const collectable = await getHotspotWithRewards(asset, anchorProvider)
    collectNav.navigate(
      iotInfo ? 'HotspotDetailsScreen' : 'AssertLocationScreen',
      { collectable },
    )
  })
  const error = fetchRecordError || callbackError
  const loading = fetchLoading || callbackLoading || loadingDc || loadingSol
  const disabled =
    loading || (balError && (insufficientMyDcBal || insufficientMySolBal))
  const [selectedOption, setSelectedOption] = useState<'contact' | 'pay'>(
    'contact',
  )

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
                  usd: totalDcReq.toNumber() / 100000,
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
                {insufficientMySolBal && (
                  <Text mt="s" variant="body1Medium" color="red500">
                    {t('hotspotOnboarding.onboarding.notEnoughSol')}
                  </Text>
                )}
                {insufficientMyDcBal && (
                  <Text mt="s" variant="body1Medium" color="red500">
                    {t('hotspotOnboarding.onboarding.notEnoughDc')}
                  </Text>
                )}
                {!insufficientMySolBal && !insufficientMyDcBal && (
                  <>
                    <Text
                      fontWeight="bold"
                      mt="s"
                      variant="body1Medium"
                      color="red500"
                    >
                      {t('hotspotOnboarding.onboarding.pay', {
                        usd: totalDcReq.toNumber() / 100000,
                      })}
                    </Text>
                    <ButtonPressable
                      marginTop="l"
                      borderRadius="round"
                      titleColor="black"
                      borderColor="transparent"
                      opacity={disabled ? 0.5 : undefined}
                      backgroundColor="red500"
                      title={t('hotspotOnboarding.onboarding.onboardAndPay')}
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
