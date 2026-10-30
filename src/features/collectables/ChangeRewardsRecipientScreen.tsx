import HntSymbol from '@assets/images/hnt.svg'
import IotSymbol from '@assets/images/iotSymbol.svg'
import MobileSymbol from '@assets/images/mobileSymbol.svg'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import { useEntityKey } from '@hooks/useEntityKey'
import { useIotInfo } from '@hooks/useIotInfo'
import { useMobileInfo } from '@hooks/useMobileInfo'
import useSubmitTxn from '@hooks/useSubmitTxn'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { PublicKey } from '@solana/web3.js'
import { CSAccount } from '@storage/cloudStorage'
import { Button } from '@ui/Button'
import { Input } from '@ui/Input'
import { PressableScale } from '@ui/PressableScale'
import { Spinner } from '@ui/Spinner'
import { Text } from '@ui/Text'
import { ellipsizeAddress, solAddressIsValid } from '@utils/accountUtils'
import { HNT_LAZY_KEY, IOT_LAZY_KEY, MOBILE_LAZY_KEY } from '@utils/constants'
import BN from 'bn.js'
import { Menu } from 'lucide-react-native'
import React, { ReactNode, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Keyboard,
  KeyboardAvoidingView,
  NativeSyntheticEvent,
  TextInputEndEditingEventData,
  TouchableWithoutFeedback,
  View,
} from 'react-native'
import Animated from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { withUniwind } from 'uniwind'
import { Mints } from '../../utils/constants'
import * as Logger from '../../utils/logger'
import AddressBookSelector, {
  AddressBookRef,
} from '../addressBook/AddressBookSelector'
import BackHeader from './components/BackHeader'
import {
  CollectableNavigationProp,
  CollectableStackParamList,
} from './collectablesTypes'

const SafeArea = withUniwind(SafeAreaView)
const HntIcon = withUniwind(HntSymbol)
const MobileIcon = withUniwind(MobileSymbol)
const IotIcon = withUniwind(IotSymbol)
const MenuIcon = withUniwind(Menu)

// One current-recipient row: network symbols, the recipient address and a
// remove button.
const RecipientRow = ({
  icons,
  address,
  removing,
  onRemove,
}: {
  icons: ReactNode
  address?: PublicKey
  removing: boolean
  onRemove: () => void
}) => {
  const { t } = useTranslation()
  return (
    <View className="mb-2 flex-row items-center rounded-md bg-secondary p-2">
      <View className="flex-1 flex-row items-center">
        {icons}
        <Text size="xs" className="ml-2 mr-2">
          Recipient
        </Text>
        <Text className="ml-2">
          {ellipsizeAddress(new PublicKey(address || '').toBase58())}
        </Text>
      </View>
      <PressableScale
        feedback="opacity"
        className="ml-4 rounded-md bg-muted px-4 py-1.5"
        onPress={onRemove}
      >
        {removing ? (
          <Spinner size="small" colorClassName="accent-foreground" />
        ) : (
          <Text size="xs" className="font-medium">
            {t('generic.remove')}
          </Text>
        )}
      </PressableScale>
    </View>
  )
}

type Route = RouteProp<
  CollectableStackParamList,
  'ChangeRewardsRecipientScreen'
>
const ChangeRewardsRecipientScreen = () => {
  const { t } = useTranslation()
  const route = useRoute<Route>()
  const nav = useNavigation<CollectableNavigationProp>()
  const wallet = useCurrentWallet()
  const { hotspot } = route.params
  const addressBookRef = useRef<AddressBookRef>(null)
  const [recipient, setRecipient] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [updating, setUpdating] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [removed, setRemoved] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [transactionError, setTransactionError] = useState<string>()
  const { submitUpdateRewardsDestination } = useSubmitTxn()

  const mobileRecipient = hotspot?.rewardRecipients?.[Mints.MOBILE]
  const iotRecipient = hotspot?.rewardRecipients?.[Mints.IOT]
  const hntRecipient = hotspot?.rewardRecipients?.[Mints.HNT]
  const entityKey = useEntityKey(hotspot)
  const { info: mobileInfoAcc } = useMobileInfo(entityKey)
  const { info: iotInfoAcc } = useIotInfo(entityKey)

  const isOtherRecipient = (destination?: PublicKey) =>
    !!destination &&
    !!wallet &&
    !new PublicKey(destination).equals(wallet) &&
    !new PublicKey(destination).equals(PublicKey.default)

  const hasIotRecipient = isOtherRecipient(iotRecipient?.destination)
  const hasMobileRecipient = isOtherRecipient(mobileRecipient?.destination)
  const hasHntRecipient = isOtherRecipient(hntRecipient?.destination)

  const recipientsAreDifferent =
    iotRecipient?.destination &&
    mobileRecipient?.destination &&
    hntRecipient?.destination &&
    new Set([
      iotRecipient?.destination?.toBase58(),
      mobileRecipient?.destination?.toBase58(),
      hntRecipient?.destination?.toBase58(),
    ]).size > 1

  const hasRecipients = hasIotRecipient || hasMobileRecipient || hasHntRecipient

  const handleAddressBookSelected = () => {
    addressBookRef?.current?.showAddressBook({})
  }

  const handleContactSelected = ({
    contact,
  }: {
    contact: CSAccount
    prevAddress?: string
  }) => {
    if (!contact.solanaAddress) return
    setRecipient(contact.solanaAddress)
    setRecipientName(contact.alias)
    setHasError(false)
  }

  const handleEditAddress = (text?: string) => {
    setRecipient(text || '')
    setRecipientName('')
  }

  const handleAddressBlur = (
    event?: NativeSyntheticEvent<TextInputEndEditingEventData>,
  ) => {
    const text = event?.nativeEvent.text
    setHasError(!solAddressIsValid(text || ''))
  }

  const handleUpdateRecipient = async () => {
    if (!solAddressIsValid(recipient)) {
      setTransactionError('Invalid Solana address')
      return
    }

    setTransactionError(undefined)
    setUpdating(true)
    try {
      const validLazyKeys: PublicKey[] = [HNT_LAZY_KEY]
      // Only add iot/mobile lazy if they actually have pending rewards,
      // otherwise we're full HNT now.
      if (
        iotInfoAcc &&
        !new BN(hotspot.pendingRewards?.[Mints.IOT] || '0').isZero()
      ) {
        validLazyKeys.push(IOT_LAZY_KEY)
      }
      if (
        mobileInfoAcc &&
        !new BN(hotspot.pendingRewards?.[Mints.MOBILE] || '0').isZero()
      ) {
        validLazyKeys.push(MOBILE_LAZY_KEY)
      }
      await submitUpdateRewardsDestination({
        lazyDistributors: validLazyKeys,
        destination: recipient,
        assetId: hotspot.id,
      })
      setUpdating(false)
      nav.goBack()
    } catch (error) {
      setUpdating(false)
      Logger.error(error)
      setTransactionError((error as Error).message)
    }
  }

  const handleRemoveRecipient = async () => {
    setTransactionError(undefined)
    setRemoving(true)
    try {
      await submitUpdateRewardsDestination({
        lazyDistributors: [HNT_LAZY_KEY, IOT_LAZY_KEY, MOBILE_LAZY_KEY],
        destination: PublicKey.default.toBase58(),
        assetId: hotspot.id,
      })
      setRemoving(false)
      setRemoved(true)
    } catch (error) {
      setRemoving(false)
      Logger.error(error)
      setTransactionError((error as Error).message)
    }
  }

  const onRemove = () => void handleRemoveRecipient().catch(console.error)

  let showError: string | undefined
  if (hasError) showError = t('generic.notValidSolanaAddress')
  else if (transactionError) showError = transactionError

  return (
    <Animated.View className="flex-1 bg-background">
      <SafeArea edges={['top', 'bottom']} className="flex-1">
        <BackHeader
          title={t('changeRewardsRecipientScreen.title')}
          className="mt-6"
        />
        <AddressBookSelector
          ref={addressBookRef}
          onContactSelected={handleContactSelected}
          hideCurrentAccount
        >
          <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
            <KeyboardAvoidingView className="flex-1" behavior="padding">
              <View className="mx-2 my-1 flex-1 p-4">
                <View className="grow justify-start">
                  <Text className="mb-2 font-medium text-muted-foreground">
                    {t('changeRewardsRecipientScreen.description')}
                  </Text>
                  <View className="mb-4 rounded-md bg-secondary p-3">
                    <Text size="xs">
                      {t('changeRewardsRecipientScreen.blurb')}
                    </Text>
                  </View>
                  {removed
                    ? null
                    : hasRecipients && (
                        <View className="mb-4 flex-col">
                          {!recipientsAreDifferent ? (
                            <RecipientRow
                              icons={
                                <>
                                  {hasIotRecipient && (
                                    <IotIcon
                                      width={20}
                                      height={20}
                                      className="mr-2"
                                      colorClassName="accent-success-500"
                                    />
                                  )}
                                  {hasMobileRecipient && (
                                    <MobileIcon
                                      width={20}
                                      height={20}
                                      className="mr-2"
                                      colorClassName="accent-blue-dark-500"
                                    />
                                  )}
                                  {hasHntRecipient && (
                                    <HntIcon
                                      width={20}
                                      height={20}
                                      className="mr-2"
                                      colorClassName="accent-blue-dark-400"
                                    />
                                  )}
                                </>
                              }
                              address={
                                hntRecipient?.destination ||
                                mobileRecipient?.destination ||
                                iotRecipient?.destination
                              }
                              removing={removing}
                              onRemove={onRemove}
                            />
                          ) : (
                            <>
                              {hasIotRecipient && (
                                <RecipientRow
                                  icons={
                                    <IotIcon
                                      width={20}
                                      height={20}
                                      className="mr-2"
                                      colorClassName="accent-success-500"
                                    />
                                  }
                                  address={iotRecipient?.destination}
                                  removing={removing}
                                  onRemove={onRemove}
                                />
                              )}
                              {hasMobileRecipient && (
                                <RecipientRow
                                  icons={
                                    <MobileIcon
                                      width={20}
                                      height={20}
                                      className="mr-2"
                                      colorClassName="accent-blue-dark-500"
                                    />
                                  }
                                  address={mobileRecipient?.destination}
                                  removing={removing}
                                  onRemove={onRemove}
                                />
                              )}
                              {hasHntRecipient && (
                                <RecipientRow
                                  icons={
                                    <HntIcon
                                      width={20}
                                      height={20}
                                      className="mr-2"
                                      colorClassName="accent-blue-dark-400"
                                    />
                                  }
                                  address={
                                    hntRecipient?.destination ||
                                    mobileRecipient?.destination ||
                                    iotRecipient?.destination
                                  }
                                  removing={removing}
                                  onRemove={onRemove}
                                />
                              )}
                            </>
                          )}
                        </View>
                      )}
                  <Text className="mt-2 mb-2 font-medium text-muted-foreground">
                    {`${t(
                      'changeRewardsRecipientScreen.newRecipient',
                    )} ${recipientName}`}
                  </Text>
                  <View className="flex-row items-center">
                    <Input
                      variant="form"
                      className="flex-1 pr-14"
                      placeholder={t('generic.solanaAddress')}
                      autoCorrect={false}
                      autoComplete="off"
                      onChangeText={handleEditAddress}
                      onEndEditing={handleAddressBlur}
                      value={recipient}
                    />
                    <PressableScale
                      feedback="opacity"
                      className="absolute right-5"
                      hitSlop={12}
                      onPress={handleAddressBookSelected}
                    >
                      <MenuIcon size={20} colorClassName="accent-foreground" />
                    </PressableScale>
                  </View>
                  <View className="my-2 rounded-md bg-secondary p-3">
                    <Text size="xs" className="font-medium text-warning-500">
                      {t('changeRewardsRecipientScreen.warning')}
                    </Text>
                  </View>
                </View>
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </AddressBookSelector>
        <View className="min-h-10 flex-row items-center justify-center">
          {showError && (
            <Text size="xs" className="font-medium text-destructive">
              {showError}
            </Text>
          )}
        </View>
        <View className="flex-row items-center justify-center px-4 pb-4">
          <Button
            variant="cta"
            size="lg"
            className="flex-1"
            onPress={
              removing || updating
                ? () => {}
                : () => void handleUpdateRecipient()
            }
          >
            {updating ? (
              <Spinner size="small" colorClassName="accent-white" />
            ) : (
              t('changeRewardsRecipientScreen.submit')
            )}
          </Button>
        </View>
      </SafeArea>
    </Animated.View>
  )
}

export default ChangeRewardsRecipientScreen
