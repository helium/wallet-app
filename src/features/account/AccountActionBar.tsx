import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { useNavigation } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import { LayoutChangeEvent, Animated } from 'react-native'
import { NetTypes } from '@helium/address'
import { Ticker } from '@helium/currency'
import { useAppStorage } from '../../storage/AppStorageProvider'
import Box from '../../components/Box'
import FabButton from '../../components/FabButton'
import { HomeNavigationProp } from '../home/homeTypes'
import { useVotesQuery } from '../../generated/graphql'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import Text from '../../components/Text'

export type Action =
  | 'send'
  | 'request'
  | 'stake'
  | 'lock'
  | 'vote'
  | '5G'
  | 'buy'

type Props = {
  ticker?: Ticker
  onLayout?: (event: LayoutChangeEvent) => void
  compact?: boolean
  maxCompact?: boolean
  hasBottomTitle?: boolean
  hasBuy?: boolean
}

const AccountActionBar = ({
  ticker,
  onLayout,
  compact,
  maxCompact,
  hasBottomTitle,
  hasBuy,
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
        // TODO: Uncomment when coinbase pay is ready
        // case 'buy': {
        //   navigation.navigate('BuyNavigator')
        //   break
        // }
        case 'vote': {
          navigation.navigate('VoteNavigator')
          break
        }
        case '5G': {
          navigation.navigate('OnboardData')
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

  const isHeliumMainnet = useMemo(
    () =>
      l1Network === 'helium' && currentAccount?.netType === NetTypes.MAINNET,
    [currentAccount, l1Network],
  )

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
      {hasBuy && (
        <Box
          marginEnd={fabMargin}
          flexDirection={hasBottomTitle ? 'column' : 'row'}
        >
          <FabButton
            icon="buy"
            backgroundColor="orange500"
            backgroundColorOpacity={0.2}
            backgroundColorOpacityPressed={0.4}
            iconColor="orange500"
            title={compact || maxCompact ? undefined : t('accountView.buy')}
            onPress={handleAction('buy')}
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
                {t('accountView.buy')}
              </Text>
            </Box>
          )}
        </Box>
      )}
      {isHeliumMainnet && (
        <Box
          marginEnd={fabMargin}
          flexDirection={hasBottomTitle ? 'column' : 'row'}
        >
          <FabButton
            zIndex={2}
            icon="vote"
            backgroundColor="purple500"
            backgroundColorOpacity={0.3}
            backgroundColorOpacityPressed={0.5}
            onPress={handleAction('vote')}
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
                {t('accountView.vote')}
              </Text>
            </Box>
          )}
          {voteData && unseenVotes?.length > 0 && (
            <Box
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              marginRight={fabMargin}
            >
              <Animated.View style={{ transform: [{ scale: anim.current }] }}>
                <Box
                  opacity={0.3}
                  borderRadius="round"
                  width="100%"
                  height="100%"
                  backgroundColor="purple500"
                />
              </Animated.View>
            </Box>
          )}
        </Box>
      )}
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
    </Box>
  )
}

export default AccountActionBar
