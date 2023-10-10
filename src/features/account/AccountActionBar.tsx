import Box from '@components/Box'
import FabButton from '@components/FabButton'
import Text from '@components/Text'
import { useNavigation } from '@react-navigation/native'
import { PublicKey } from '@solana/web3.js'
import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutChangeEvent } from 'react-native'
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

  const handleAction = useCallback(
    (type: Action) => () => {
      switch (type) {
        case 'send': {
          if (pin?.status === 'on' && requirePinForPayment) {
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
    },
    [pin?.status, requirePinForPayment, navigation, mint],
  )

  const fabMargin = useMemo(() => {
    if (compact) return 'm'
    if (maxCompact) return 's'
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
            backgroundColor="greenBright500"
            backgroundColorOpacity={0.2}
            backgroundColorOpacityPressed={0.4}
            iconColor="greenBright500"
            title={compact || maxCompact ? undefined : t('accountView.deposit')}
            onPress={handleAction('request')}
            width={maxCompact ? 47.5 : undefined}
            height={maxCompact ? 47.5 : undefined}
            justifyContent="center"
          />
          {hasBottomTitle && (
            <Box marginTop="s">
              <Text
                variant="body2Medium"
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
            backgroundColor="orange500"
            backgroundColorOpacity={0.2}
            backgroundColorOpacityPressed={0.4}
            iconColor="orange500"
            title={compact || maxCompact ? undefined : t('accountView.swaps')}
            onPress={handleAction('swaps')}
            width={maxCompact ? 47.5 : undefined}
            height={maxCompact ? 47.5 : undefined}
            justifyContent="center"
          />
          {hasBottomTitle && (
            <Box marginTop="s">
              <Text
                variant="body2Medium"
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
            backgroundColor="electricViolet"
            backgroundColorOpacity={0.2}
            backgroundColorOpacityPressed={0.4}
            iconColor="electricViolet"
            title={
              compact || maxCompact ? undefined : t('airdropScreen.airdrop')
            }
            onPress={handleAction('airdrop')}
            width={maxCompact ? 47.5 : undefined}
            height={maxCompact ? 47.5 : undefined}
            justifyContent="center"
          />
          {hasBottomTitle && (
            <Box marginTop="s">
              <Text
                variant="body2Medium"
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
            backgroundColor="blueBright500"
            backgroundColorOpacity={0.2}
            backgroundColorOpacityPressed={0.4}
            iconColor="blueBright500"
            title={compact || maxCompact ? undefined : t('accountView.send')}
            onPress={handleAction('send')}
            reverse
            width={maxCompact ? 47.5 : undefined}
            height={maxCompact ? 47.5 : undefined}
            justifyContent="center"
          />
          {hasBottomTitle && (
            <Box marginTop="s">
              <Text
                variant="body2Medium"
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
          backgroundColor="blueBright500"
          backgroundColorOpacity={0.2}
          backgroundColorOpacityPressed={0.1}
          iconColor="blueBright500"
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
