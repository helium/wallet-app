import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { useNavigation } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import { LayoutChangeEvent, Animated } from 'react-native'
import { Ticker } from '@helium/currency'
import Box from '@components/Box'
import FabButton from '@components/FabButton'
import Text from '@components/Text'
import { useAppStorage } from '../../storage/AppStorageProvider'
import { HomeNavigationProp } from '../home/homeTypes'
import { useVotesQuery } from '../../generated/graphql'
import { useAccountStorage } from '../../storage/AccountStorageProvider'

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
  ticker?: Ticker
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
  ticker,
}: Props) => {
  const navigation = useNavigation<HomeNavigationProp>()
  const { t } = useTranslation()
  const { requirePinForPayment, l1Network, pin } = useAppStorage()
  const anim = useRef(new Animated.Value(1))
  const { currentAccount } = useAccountStorage()

  const { data: voteData } = useVotesQuery({
    variables: { address: currentAccount?.address || '' },
    skip: !currentAccount?.address,
    fetchPolicy: 'cache-and-network',
  })

  const unseenVotes = useMemo(() => {
    const seenVoteIds = currentAccount?.voteIdsSeen || []
    return (
      voteData?.votes.active.filter((v) => !seenVoteIds.includes(v.id)) || []
    )
  }, [currentAccount, voteData])

  useEffect(() => {
    // makes the sequence loop
    if (voteData && unseenVotes?.length > 0) {
      const res = Animated.loop(
        // runs given animations in a sequence
        Animated.sequence([
          // increase size
          Animated.timing(anim.current, {
            toValue: 1.2,
            duration: 2000,
            useNativeDriver: true,
          }),
          // decrease size
          Animated.timing(anim.current, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
      )

      // start the animation
      res.start()

      return () => {
        // stop animation
        res.reset()
      }
    }
  }, [currentAccount, unseenVotes.length, voteData])

  const handleAction = useCallback(
    (type: Action) => () => {
      switch (type) {
        case 'send': {
          if (pin?.status === 'on' && requirePinForPayment) {
            navigation.navigate('ConfirmPin', { action: 'payment' })
          } else {
            navigation.navigate('PaymentScreen', {
              defaultTokenType: ticker,
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
          navigation.navigate('AirdropScreen', { ticker: ticker || 'HNT' })
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
    [navigation, pin, requirePinForPayment, ticker],
  )

  const fabMargin = useMemo(() => {
    if (compact) return 'm'
    if (maxCompact) return 's'
    return undefined
  }, [compact, maxCompact])

  if (currentAccount?.ledgerDevice && l1Network !== 'helium') {
    return null
  }

  return (
    <Box
      justifyContent="center"
      alignItems="center"
      flexDirection="row"
      onLayout={onLayout}
      width={compact || maxCompact ? undefined : '100%'}
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
