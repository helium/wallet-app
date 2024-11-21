import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import RadioButton from '@components/RadioButton'
import Text from '@components/Text'
import {
  init,
  iotInfoKey,
  keyToAssetKey,
} from '@helium/helium-entity-manager-sdk'
import { useHotspotBle, useOnboarding } from '@helium/react-native-sdk'
import {
  IOT_MINT,
  bufferToTransaction,
  getAsset,
  sendAndConfirmWithRetry,
  truthy,
} from '@helium/spl-utils'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import { useImplicitBurn } from '@hooks/useImplicitBurn'
import { useKeyToAsset } from '@hooks/useKeyToAsset'
import { useOnboardingBalnces } from '@hooks/useOnboardingBalances'
import { LAMPORTS_PER_SOL, PublicKey, Transaction } from '@solana/web3.js'
import { useAccountStorage } from '@storage/AccountStorageProvider'
import { IOT_CONFIG_KEY, DAO_KEY } from '@utils/constants'
import sleep from '@utils/sleep'
import { getHotspotWithRewards, isInsufficientBal } from '@utils/solanaUtils'
import BN from 'bn.js'
import { Buffer } from 'buffer'
import React, { useMemo, useState } from 'react'
import { useAsync, useAsyncCallback } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { Alert, Linking } from 'react-native'
import ScrollBox from '@components/ScrollBox'
import { useColors, useSpacing } from '@theme/themeHooks'
import Map from '@components/Map'
import { Camera } from '@rnmapbox/maps'
import ImageBox from '@components/ImageBox'
import { getAddressFromLatLng } from '@utils/location'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { ReAnimatedBox } from '@components/AnimatedBox'
import TouchableContainer from '@components/TouchableContainer'
import RightArrow from '@assets/images/rightArrow.svg'
import AccountIcon from '@components/AccountIcon'
import { useBottomSheet } from '@gorhom/bottom-sheet'
import { useNavigation } from '@react-navigation/native'
import { HotspotServiceNavigationProp } from '@services/HotspotService'
import Loading from '../../components/Loading'
import { useSolana } from '../../../../../../solana/SolanaProvider'
import { useHotspotOnboarding } from '../..'

const REQUIRED_SOL = new BN((0.00089088 + 0.00001) * LAMPORTS_PER_SOL)
const AddToWalletScreen = () => {
  const { onboardingClient, getOnboardTransactions } = useOnboarding()
  const { currentAccount } = useAccountStorage()
  const { anchorProvider } = useSolana()
  const { t } = useTranslation()
  const wallet = useCurrentWallet()
  const spacing = useSpacing()
  const colors = useColors()
  const { close } = useBottomSheet()
  const navigation = useNavigation<HotspotServiceNavigationProp>()

  const {
    onboardDetails: {
      iotDetails: { animalName },
      latitude,
      longitude,
      height,
    },
  } = useHotspotOnboarding()

  const {
    isConnected,
    getOnboardingAddress,
    createGatewayTxn: getCreateGatewayTxn,
  } = useHotspotBle()

  const { result: connected } = useAsync(isConnected, [])

  const {
    result: {
      address: onboardingAddress,
      keyToAssetK,
      createGatewayTx,
    } = {} as {
      address?: string
      keyToAssetK?: PublicKey
      createGatewayTx?: string
    },
  } = useAsync(
    async (
      c: boolean | undefined,
      accountAddress?: string,
    ): Promise<{
      address?: string
      keyToAssetK?: PublicKey
      createGatewayTx?: string
    }> => {
      if (c && accountAddress) {
        const addr = await getOnboardingAddress()
        const tx = await getCreateGatewayTxn({
          ownerAddress: accountAddress,
          payerAddress: accountAddress,
        })
        // For testing
        // const addr = TEST_HOTSPOT.address.b58
        return {
          address: addr,
          keyToAssetK: keyToAssetKey(DAO_KEY, addr, 'b58')[0],
          createGatewayTx: tx,
        }
      }
      return {}
    },
    [connected, currentAccount?.address],
  )

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
  } = useOnboardingBalnces(onboardingAddress)

  const { info: keyToAsset } = useKeyToAsset(keyToAssetK?.toBase58())
  const { result: asset } = useAsync(async () => {
    if (anchorProvider && keyToAsset) {
      return getAsset(anchorProvider.connection.rpcEndpoint, keyToAsset.asset)
    }
    return undefined
  }, [anchorProvider, keyToAsset])
  const wrongOwner = asset && wallet && !asset.ownership.owner.equals(wallet)
  const mint = IOT_MINT
  const requiredDc = onboardingDcRequirements[mint.toBase58()] || new BN(0)
  const assertRequiredDc =
    locationAssertDcRequirements[mint.toBase58()] || new BN(0)
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
    const txnStr = createGatewayTx
    const hemProgram = await init(anchorProvider)
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

    let createHotspotTxns: Buffer[] = []
    if (txnStr) {
      const createTxns = await onboardingClient.createHotspot({
        transaction: txnStr,
      })

      createHotspotTxns =
        createTxns.data?.solanaTransactions?.map((createHotspotTx) =>
          Buffer.from(createHotspotTx),
        ) || []
    }

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

    const configKey = IOT_CONFIG_KEY
    const fetcher = hemProgram.account.iotHotspotInfoV0
    const networkInfoK = iotInfoKey(configKey, onboardingAddress || '')[0]

    const networkInfo = await fetcher.fetchNullable(networkInfoK)
    if (!networkInfo && onboardingAddress) {
      // Implicit burn to DC if needed
      if (payer) {
        await implicitBurn(requiredDc.toNumber())
      }

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const { solanaTransactions } = await getOnboardTransactions({
        hotspotAddress: onboardingAddress,
        payer,
        networkDetails: [
          {
            hotspotType: 'IOT',
            lat: latitude,
            lng: longitude,
            elevation: height,
          },
        ],
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

    let totalTime = 0
    let keyToAssetPostOnboard = keyToAsset
    // Wait up to 30s for hotspot to exist
    while (!keyToAssetPostOnboard && totalTime < 30 * 1000) {
      // eslint-disable-next-line no-await-in-loop
      await sleep(2000)
      totalTime += 2000
      // eslint-disable-next-line no-await-in-loop
      keyToAssetPostOnboard =
        await hemProgram.account.keyToAssetV0.fetchNullable(
          keyToAssetK?.toBase58() || '',
        )
    }
    if (!keyToAssetPostOnboard) {
      throw new Error(t('hotspotOnboarding.onboarding.failedToFind'))
    }
    const { asset: assetPostOnboard } = keyToAssetPostOnboard
    const collectable = await getHotspotWithRewards(
      assetPostOnboard,
      anchorProvider,
    )

    close()
    navigation.navigate('Hotspot', {
      newHotspot: collectable,
    })
  })
  const error =
    onboardBalError ||
    callbackError ||
    (wrongOwner && new Error(t('hotspotOnboarding.onboarding.wrongOwner'))) ||
    (!maker &&
      !loadingMaker &&
      new Error(t('hotspotOnboarding.onboarding.makerNotFound')))
  const loading =
    loadingMaker ||
    callbackLoading ||
    loadingMakerDc ||
    loadingMakerSol ||
    loadingMyDc ||
    loadingMySol ||
    loadingOnboardingDcRequirements
  const disabled =
    wrongOwner ||
    !maker ||
    loading ||
    (balError && (insufficientMyDcBal || insufficientMySolBal))
  const [selectedOption, setSelectedOption] = useState<'contact' | 'pay'>(
    'contact',
  )
  const usd = requiredDc.toNumber() / 100000
  const assertUsd = assertRequiredDc.toNumber() / 100000

  const { result: location } = useAsync(async () => {
    const address = await getAddressFromLatLng(latitude, longitude)

    return `~${address?.street ? `${address?.street}, ` : ''}${address.city}, ${
      address.state
    }`
  }, [latitude, longitude])

  const floor = useMemo(() => height / 5, [height])

  const contentContainerStyle = useMemo(
    () => ({
      flexGrow: 1,
      padding: spacing['2xl'],
      paddingBottom: spacing['10xl'],
    }),
    [spacing],
  )

  return (
    <>
      <ScrollBox contentContainerStyle={contentContainerStyle}>
        <Box height={266} width="100%" marginBottom="7xl">
          <Box flex={1} width="100%" overflow="hidden" borderRadius="6xl">
            <Map style={{ flex: 1 }} pointerEvents="none">
              <Camera
                maxZoomLevel={22}
                centerCoordinate={[longitude, latitude]}
                zoomLevel={16}
              />
            </Map>
          </Box>
          <Box
            position="absolute"
            bottom={-100}
            left={-5}
            right={0}
            alignItems="center"
          >
            <ImageBox
              width={170}
              height={180}
              source={require('@assets/images/ogHotspot.png')}
            />
          </Box>
        </Box>
        <Text
          variant="displaySmRegular"
          color="text.quaternary-500"
          fontSize={12}
          marginTop="4xl"
          marginBottom="1.5"
          letterSpacing={3}
          textAlign="center"
        >
          {t('AddToWalletScreen.title')}
        </Text>
        <Text
          variant="displaySmSemibold"
          color="primaryText"
          textAlign="center"
          marginBottom="2xl"
        >
          {animalName}
        </Text>
        <Box
          backgroundColor="cardBackground"
          borderRadius="2xl"
          paddingVertical="2.5"
          paddingHorizontal="2"
          width="100%"
        >
          <Text variant="textMdSemibold" color="primaryText" textAlign="center">
            {location}
          </Text>
          <Text
            variant="textMdRegular"
            color="text.quaternary-500"
            textAlign="center"
          >
            {t('AddToWalletScreen.addressDetailsIndoor', {
              floor,
            })}
          </Text>
        </Box>
        {error && (
          <Text
            variant="textMdMedium"
            color="error.500"
            textAlign="center"
            marginTop="2xl"
          >
            {error.message ? error.message.toString() : error.toString()}
          </Text>
        )}
        {!wrongOwner && balError && (
          <>
            <Text
              variant="textMdMedium"
              color="error.500"
              mt="2xl"
              marginHorizontal="2xl"
            >
              {t('hotspotOnboarding.onboarding.responsible')}
            </Text>
            <Text
              mt="2"
              variant="textMdMedium"
              color="error.500"
              marginHorizontal="2xl"
            >
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
            <Text
              mt="2"
              variant="textMdMedium"
              color="error.500"
              marginHorizontal="2xl"
            >
              {t('hotspotOnboarding.onboarding.twoSolutions')}
            </Text>
            <Box
              pl="2"
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
                marginTop="6"
                borderRadius="full"
                titleColor="primaryBackground"
                borderColor="transparent"
                backgroundColor="primaryText"
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
                  <Text
                    mt="2"
                    variant="textMdMedium"
                    color="error.500"
                    marginHorizontal="2xl"
                    textAlign="center"
                  >
                    {t('hotspotOnboarding.onboarding.notEnoughSol')}
                  </Text>
                )}
                {!callbackLoading && insufficientMyDcBal && (
                  <Text
                    mt="2"
                    variant="textMdMedium"
                    color="error.500"
                    marginHorizontal="2xl"
                    textAlign="center"
                  >
                    {t('hotspotOnboarding.onboarding.notEnoughDc')}
                  </Text>
                )}
                {(callbackLoading ||
                  (!insufficientMySolBal && !insufficientMyDcBal)) && (
                  <>
                    <Text
                      fontWeight="bold"
                      mt="2"
                      variant="textMdMedium"
                      color="error.500"
                      marginHorizontal="2xl"
                      textAlign="center"
                    >
                      {t('hotspotOnboarding.onboarding.pay', {
                        usd,
                        assertUsd,
                      })}
                    </Text>
                  </>
                )}
              </>
            )}
          </>
        )}
      </ScrollBox>
      <ReAnimatedBox
        entering={FadeIn}
        exiting={FadeOut}
        flexDirection="row"
        justifyContent="flex-end"
        paddingBottom="4xl"
        paddingHorizontal="2xl"
        position="absolute"
        bottom={0}
        right={0}
      >
        {loading ? (
          <Loading />
        ) : (
          <TouchableContainer
            onPress={handleAddGateway}
            backgroundColor="primaryText"
            backgroundColorPressed="primaryText"
            flexDirection="row"
            borderRadius="full"
            paddingStart="2xl"
            paddingEnd="xl"
            paddingVertical="3"
            alignItems="center"
            opacity={disabled ? 0.75 : undefined}
            disabled={disabled}
            pressableStyles={{ flex: undefined }}
          >
            <Text
              variant="textLgSemibold"
              color="primaryBackground"
              marginRight="md"
            >
              {t('OnboardingSheet.addToWallet')}
            </Text>
            <Box marginEnd="xl">
              <RightArrow color={colors.primaryBackground} />
            </Box>
            <AccountIcon size={36} address={wallet?.toBase58()} />
          </TouchableContainer>
        )}
      </ReAnimatedBox>
    </>
  )
}

export default AddToWalletScreen
