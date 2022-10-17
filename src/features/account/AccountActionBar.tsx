import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { useNavigation } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import { LayoutChangeEvent, Animated } from 'react-native'
import { NetTypes } from '@helium/address'
import { useAppStorage } from '../../storage/AppStorageProvider'
import Box from '../../components/Box'
import FabButton from '../../components/FabButton'
import { HomeNavigationProp } from '../home/homeTypes'
import { TokenType, useVotesQuery } from '../../generated/graphql'
import { useAccountStorage } from '../../storage/AccountStorageProvider'

export type Action = 'send' | 'request' | 'stake' | 'lock' | 'vote' | '5G'

type Props = {
  tokenType?: TokenType
  onLayout?: (event: LayoutChangeEvent) => void
  compact?: boolean
}

const AccountActionBar = ({ tokenType, onLayout, compact }: Props) => {
  const navigation = useNavigation<HomeNavigationProp>()
  const { t } = useTranslation()
  const { requirePinForPayment, pin, l1Network } = useAppStorage()
  const anim = useRef(new Animated.Value(1))
  const { currentAccount } = useAccountStorage()

  const { data: voteData } = useVotesQuery({
    variables: { address: currentAccount?.address || '' },
    skip: !currentAccount?.address,
    fetchPolicy: 'cache-and-network',
  })

  useEffect(() => {
    const seenVoteIds = currentAccount?.voteIdsSeen || []
    const unseenVotes =
      voteData?.votes.active.filter((v) => !seenVoteIds.includes(v.id)) || []

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
  }, [currentAccount, voteData])

  const handleAction = useCallback(
    (type: Action) => () => {
      switch (type) {
        case 'send': {
          if (pin?.status === 'on' && requirePinForPayment) {
            navigation.navigate('ConfirmPin', { action: 'payment' })
          } else {
            navigation.navigate('PaymentScreen', {
              defaultTokenType: tokenType,
            })
          }
          break
        }
        case 'request': {
          navigation.navigate('RequestScreen')
          break
        }
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
    [navigation, pin, requirePinForPayment, tokenType],
  )

  const isHeliumMainnet = useMemo(
    () =>
      l1Network === 'helium' && currentAccount?.netType === NetTypes.MAINNET,
    [currentAccount, l1Network],
  )

  return (
    <Box
      flexDirection="row"
      justifyContent="center"
      marginHorizontal={compact ? undefined : 's'}
      onLayout={onLayout}
      width={compact ? undefined : '100%'}
    >
      <Box flex={compact ? undefined : 1}>
        <FabButton
          icon="fatArrowDown"
          marginLeft="s"
          backgroundColor="greenBright500"
          backgroundColorOpacity={0.2}
          backgroundColorOpacityPressed={0.4}
          iconColor="greenBright500"
          title={compact ? undefined : t('accountView.request')}
          marginRight={compact ? 'm' : undefined}
          onPress={handleAction('request')}
        />
      </Box>
      {!compact && isHeliumMainnet && (
        <Box>
          <FabButton
            zIndex={2}
            icon="vote"
            backgroundColor="purple500"
            backgroundColorOpacity={0.3}
            backgroundColorOpacityPressed={0.5}
            onPress={handleAction('vote')}
          />
          <Box position="absolute" top={0} left={0} right={0} bottom={0}>
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
        </Box>
      )}
      <Box flex={compact ? undefined : 1}>
        <FabButton
          icon="fatArrowUp"
          backgroundColor="blueBright500"
          backgroundColorOpacity={0.2}
          backgroundColorOpacityPressed={0.4}
          iconColor="blueBright500"
          title={compact ? undefined : t('accountView.send')}
          onPress={handleAction('send')}
          reverse
        />
      </Box>
    </Box>
  )
}

export default AccountActionBar
