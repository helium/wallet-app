import Box from '@components/Box'
import FabButton from '@components/FabButton'
import Text from '@components/Text'
import { useNavigation } from '@react-navigation/native'
import { PublicKey } from '@solana/web3.js'
import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutChangeEvent } from 'react-native'
import { WalletServiceNavigationProp } from '@services/WalletService'
import { WalletNavigationProp } from '@services/WalletService/pages/WalletPage/WalletPageNavigator'
import { useAppStorage } from '../../storage/AppStorageProvider'

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
  const navigation = useNavigation<WalletServiceNavigationProp>()
  const walletPageNav = useNavigation<WalletNavigationProp>()
  const { t } = useTranslation()
  const { requirePinForPayment, pin } = useAppStorage()

  const handleAction = useCallback(
    (type: Action) => () => {
      switch (type) {
        default:
        case 'send': {
          if (
            (pin?.status === 'on' || pin?.status === 'restored') &&
            requirePinForPayment
          ) {
            walletPageNav.navigate('ConfirmPin', { action: 'payment' })
          } else {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            navigation.navigate('Send', {
              screen: 'PaymentScreen',
              params: {
                mint: mint?.toBase58(),
              },
            })
          }
          break
        }
        case 'request': {
          navigation.navigate('Receive')
          break
        }
        case 'swaps': {
          navigation.navigate('Swap')
          break
        }
        case 'airdrop': {
          if (mint) {
            walletPageNav.navigate('AirdropScreen', { mint: mint?.toBase58() })
          }
          break
        }
        case 'delegate': {
          walletPageNav.navigate('BurnScreen', {
            address: '',
            amount: '',
            isDelegate: true,
          })
          break
        }
      }
    },
    [pin?.status, requirePinForPayment, navigation, mint, walletPageNav],
  )

  const fabMargin = useMemo(() => {
    if (compact) return '4'
    if (maxCompact) return '2'
    return undefined
  }, [compact, maxCompact])

  return (
    <Box
      justifyContent="center"
      alignItems="center"
      flexDirection="row"
      onLayout={onLayout}
      width={maxCompact ? undefined : '100%'}
    >
      {hasRequest && (
        <Box
          flexDirection={hasBottomTitle ? 'column' : 'row'}
          flex={compact || maxCompact ? undefined : 1}
          marginEnd={fabMargin}
        >
          <FabButton
            icon="fatArrowDown"
            backgroundColor="primaryText"
            backgroundColorOpacityPressed={0.4}
            iconColor="primaryBackground"
            title={compact || maxCompact ? undefined : t('accountView.deposit')}
            onPress={handleAction('request')}
            width={maxCompact ? 47.5 : undefined}
            height={maxCompact ? 47.5 : undefined}
            justifyContent="center"
          />
          {hasBottomTitle && (
            <Box marginTop="2">
              <Text
                variant="textSmMedium"
                color="secondaryText"
                marginTop="xs"
                textAlign="center"
              >
                {t('accountView.deposit')}
              </Text>
            </Box>
          )}
        </Box>
      )}
      {hasSwaps && (
        <Box
          marginEnd={fabMargin}
          flexDirection={hasBottomTitle ? 'column' : 'row'}
        >
          <FabButton
            icon="swaps"
            backgroundColor="primaryText"
            backgroundColorOpacityPressed={0.4}
            iconColor="primaryBackground"
            title={compact || maxCompact ? undefined : t('accountView.swaps')}
            onPress={handleAction('swaps')}
            width={maxCompact ? 47.5 : undefined}
            height={maxCompact ? 47.5 : undefined}
            justifyContent="center"
          />
          {hasBottomTitle && (
            <Box marginTop="2">
              <Text
                variant="textSmMedium"
                color="secondaryText"
                marginTop="xs"
                textAlign="center"
              >
                {t('accountView.swaps')}
              </Text>
            </Box>
          )}
        </Box>
      )}
      {hasAirdrop && (
        <Box
          marginEnd={fabMargin}
          flexDirection={hasBottomTitle ? 'column' : 'row'}
        >
          <FabButton
            icon="airdrop"
            backgroundColor="primaryText"
            backgroundColorOpacityPressed={0.4}
            iconColor="primaryBackground"
            title={
              compact || maxCompact ? undefined : t('airdropScreen.airdrop')
            }
            onPress={handleAction('airdrop')}
            width={maxCompact ? 47.5 : undefined}
            height={maxCompact ? 47.5 : undefined}
            justifyContent="center"
          />
          {hasBottomTitle && (
            <Box marginTop="2">
              <Text
                variant="textSmMedium"
                color="secondaryText"
                marginTop="xs"
                textAlign="center"
              >
                {t('airdropScreen.airdrop')}
              </Text>
            </Box>
          )}
        </Box>
      )}
      {hasSend && (
        <Box
          flexDirection={hasBottomTitle ? 'column' : 'row'}
          flex={compact || maxCompact ? undefined : 1}
        >
          <FabButton
            icon="fatArrowUp"
            backgroundColor="primaryText"
            backgroundColorOpacityPressed={0.4}
            iconColor="primaryBackground"
            title={compact || maxCompact ? undefined : t('accountView.send')}
            onPress={handleAction('send')}
            reverse
            width={maxCompact ? 47.5 : undefined}
            height={maxCompact ? 47.5 : undefined}
            justifyContent="center"
          />
          {hasBottomTitle && (
            <Box marginTop="2">
              <Text
                variant="textSmMedium"
                color="secondaryText"
                marginTop="xs"
                textAlign="center"
              >
                {t('accountView.send')}
              </Text>
            </Box>
          )}
        </Box>
      )}
      {hasDelegate && (
        <FabButton
          backgroundColor="blue.light-500"
          backgroundColorOpacity={0.2}
          backgroundColorOpacityPressed={0.1}
          iconColor="blue.light-500"
          title={compact || maxCompact ? undefined : t('accountView.delegate')}
          onPress={handleAction('delegate')}
          reverse
          width={maxCompact ? 47.5 : undefined}
          height={maxCompact ? 47.5 : undefined}
          justifyContent="center"
        />
      )}
    </Box>
  )
}

export default AccountActionBar
