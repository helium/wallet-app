import BackScreen from '@components/BackScreen'
import ButtonPressable from '@components/ButtonPressable'
import CircleLoader from '@components/CircleLoader'
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
  bufferToTransaction,
  heliumAddressToSolAddress,
  sendAndConfirmWithRetry,
} from '@helium/spl-utils'
import { useNavigation } from '@react-navigation/native'
import { LAMPORTS_PER_SOL, PublicKey, Transaction } from '@solana/web3.js'
import { useAccountStorage } from '@storage/AccountStorageProvider'
import { DAO_KEY, IOT_SUB_DAO_KEY } from '@utils/constants'
import { getHotspotWithRewards, isInsufficientBal } from '@utils/solanaUtils'
import { Buffer } from 'buffer'
import React from 'react'
import { useAsyncCallback } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { Alert } from 'react-native'
import { TabBarNavigationProp } from '../../../navigation/rootTypes'
import { useSolana } from '../../../solana/SolanaProvider'
import { CollectableNavigationProp } from '../../collectables/collectablesTypes'

const AddGatewayBle = () => {
  const { getOnboardingRecord, getOnboardTransactions, onboardingClient } =
    useOnboarding()
  const { createGatewayTxn, getOnboardingAddress } = useHotspotBle()
  const { currentAccount } = useAccountStorage()
  const { anchorProvider } = useSolana()
  const { t } = useTranslation()
  const tabNav = useNavigation<TabBarNavigationProp>()
  const collectNav = useNavigation<CollectableNavigationProp>()

  const {
    execute: handleAddGateway,
    loading,
    error,
  } = useAsyncCallback(async () => {
    if (!anchorProvider) {
      Alert.alert('Error', 'No anchor provider')
      return
    }
    const accountAddress = currentAccount?.address
    if (!accountAddress) {
      Alert.alert(
        'Error',
        'You must first add a wallet address from the main menu',
      )
      return
    }

    const onboardAddress = await getOnboardingAddress()
    const onboardRecord = await getOnboardingRecord(onboardAddress)

    if (!onboardRecord) {
      throw new Error(
        t('hotspotOnboarding.onboarding.hotspotNotFound', {
          onboardAddress,
        }),
      )
    }

    if (!onboardRecord?.maker.address) {
      throw new Error(t('hotspotOnboarding.onboarding.makerNotFound'))
    }
    const makerSolAddr = heliumAddressToSolAddress(onboardRecord?.maker.address)
    const makerSolBalance = (
      await anchorProvider.connection.getAccountInfo(
        new PublicKey(makerSolAddr),
      )
    )?.lamports
    if (
      !makerSolBalance ||
      makerSolBalance / LAMPORTS_PER_SOL < 0.00089088 + 0.00001
    ) {
      throw new Error(
        t('hotspotOnboarding.onboarding.manufacturerMissingSol', {
          name: onboardRecord?.maker.name,
        }),
      )
    }

    const txnStr = await createGatewayTxn({
      ownerAddress: accountAddress,
      payerAddress: onboardRecord?.maker.address,
    })
    const tx = AddGatewayV1.fromString(txnStr)
    if (!tx?.gateway?.b58) {
      throw new Error('Error signing gateway txn')
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function wrapProgramError(e: any) {
      if (isInsufficientBal(e)) {
        throw new Error(
          t('hotspotOnboarding.onboarding.manufacturerMissingDcOrSol', {
            name: onboardRecord?.maker.name,
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
            skipPreflight: true,
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
    if (!iotInfo) {
      const { solanaTransactions } = await getOnboardTransactions({
        hotspotAddress: onboardAddress,
        networkDetails: [{ hotspotType: 'iot' }],
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

  return (
    <BackScreen title={t('hotspotOnboarding.onboarding.title')}>
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
      {loading && <CircleLoader />}
      {error && (
        <Text variant="body1Medium" color="red500">
          {error.message ? error.message.toString() : error.toString()}
        </Text>
      )}
      <ButtonPressable
        marginTop="l"
        borderRadius="round"
        titleColor="black"
        borderColor="transparent"
        backgroundColor="white"
        title={t('hotspotOnboarding.onboarding.onboard')}
        onPress={handleAddGateway}
        disabled={loading}
      />
      <ButtonPressable
        marginTop="l"
        titleColor="white"
        backgroundColor="transparent"
        title={t('generic.skip')}
        onPress={() => tabNav.navigate('Collectables')}
      />
    </BackScreen>
  )
}

export default AddGatewayBle
