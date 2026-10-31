import { useNavigation } from '@react-navigation/native'
import { PublicKey } from '@solana/web3.js'
import { FabButton } from '@ui/FabButton'
import { Text } from '@ui/Text'
import { twMerge } from '@ui/twMerge'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutChangeEvent, View } from 'react-native'
import { useAppStorage } from '../../storage/AppStorageProvider'
import { HomeNavigationProp } from '../home/homeTypes'

export type Action =
  | 'send'
  | 'request'
  | 'stake'
  | 'lock'
  | '5G'
  | 'delegate'
  | 'swaps'
  | 'airdrop'

type Props = {
  mint?: PublicKey
  onLayout?: (event: LayoutChangeEvent) => void
  compact?: boolean
  maxCompact?: boolean
  hasBottomTitle?: boolean
  hasSend?: boolean
  hasRequest?: boolean
  hasDelegate?: boolean
  hasSwaps?: boolean
  hasAirdrop?: boolean
}

const AccountActionBar = ({
  onLayout,
  compact,
  maxCompact,
  hasBottomTitle,
  hasSend = true,
  hasRequest = true,
  hasDelegate,
  hasSwaps,
  hasAirdrop,
  mint,
}: Props) => {
  const navigation = useNavigation<HomeNavigationProp>()
  const { t } = useTranslation()
  const { requirePinForPayment, pin } = useAppStorage()

  const handleAction = (type: Action) => () => {
    switch (type) {
      case 'send': {
        if (
          (pin?.status === 'on' || pin?.status === 'restored') &&
          requirePinForPayment
        ) {
          navigation.navigate('ConfirmPin', { action: 'payment' })
        } else {
          navigation.navigate('PaymentScreen', {
            mint: mint?.toBase58(),
          })
        }
        break
      }
      case 'request': {
        navigation.navigate('RequestScreen')
        break
      }
      case 'swaps': {
        navigation.navigate('SwapNavigator')
        break
      }
      case 'airdrop': {
        if (mint) {
          navigation.navigate('AirdropScreen', { mint: mint?.toBase58() })
        }
        break
      }
      case '5G': {
        navigation.navigate('OnboardData')
        break
      }
      case 'delegate': {
        navigation.navigate('BurnScreen', {
          address: '',
          amount: '',
          isDelegate: true,
        })
        break
      }
      default: {
        // show()
        break
      }
    }
  }

  let fabMargin: string | undefined
  if (compact) fabMargin = 'me-4'
  else if (maxCompact) fabMargin = 'me-2'
  const direction = hasBottomTitle ? 'flex-col' : 'flex-row'
  const grow = compact || maxCompact ? undefined : 'flex-1'

  return (
    <View
      className={twMerge(
        'flex-row items-center justify-center',
        !maxCompact && 'w-full',
      )}
      onLayout={onLayout}
    >
      {hasRequest && (
        <View className={twMerge(direction, grow, fabMargin)}>
          <FabButton
            icon="fatArrowDown"
            tone="success"
            title={compact || maxCompact ? undefined : t('accountView.deposit')}
            onPress={handleAction('request')}
            className={maxCompact ? 'size-12' : undefined}
          />
          {hasBottomTitle && (
            <Text className="mt-3 text-center font-medium text-muted-foreground">
              {t('accountView.deposit')}
            </Text>
          )}
        </View>
      )}
      {hasSwaps && (
        <View className={twMerge(direction, fabMargin)}>
          <FabButton
            testID={compact ? 'AccountActionBar.Swaps' : undefined}
            icon="swaps"
            tone="warning"
            title={compact || maxCompact ? undefined : t('accountView.swaps')}
            onPress={handleAction('swaps')}
            className={maxCompact ? 'size-12' : undefined}
          />
          {hasBottomTitle && (
            <Text className="mt-3 text-center font-medium text-muted-foreground">
              {t('accountView.swaps')}
            </Text>
          )}
        </View>
      )}
      {hasAirdrop && (
        <View className={twMerge(direction, fabMargin)}>
          <FabButton
            icon="airdrop"
            tone="accent"
            title={
              compact || maxCompact ? undefined : t('airdropScreen.airdrop')
            }
            onPress={handleAction('airdrop')}
            className={maxCompact ? 'size-12' : undefined}
          />
          {hasBottomTitle && (
            <Text className="mt-3 text-center font-medium text-muted-foreground">
              {t('airdropScreen.airdrop')}
            </Text>
          )}
        </View>
      )}
      {hasSend && (
        <View className={twMerge(direction, grow)}>
          <FabButton
            testID={compact ? 'AccountActionBar.Send' : undefined}
            icon="fatArrowUp"
            tone="info"
            title={compact || maxCompact ? undefined : t('accountView.send')}
            onPress={handleAction('send')}
            reverse
            className={maxCompact ? 'size-12' : undefined}
          />
          {hasBottomTitle && (
            <Text className="mt-3 text-center font-medium text-muted-foreground">
              {t('accountView.send')}
            </Text>
          )}
        </View>
      )}
      {hasDelegate && (
        <FabButton
          tone="info"
          title={compact || maxCompact ? undefined : t('accountView.delegate')}
          onPress={handleAction('delegate')}
          reverse
          className={maxCompact ? 'size-12' : undefined}
        />
      )}
    </View>
  )
}

export default AccountActionBar
