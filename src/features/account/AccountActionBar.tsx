import React, { useCallback } from 'react'
import { useNavigation } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import { LayoutChangeEvent } from 'react-native'
import { useAppStorage } from '../../storage/AppStorageProvider'
import Box from '../../components/Box'
import FabButton from '../../components/FabButton'
import { HomeNavigationProp } from '../home/homeTypes'
import { TokenType } from '../../generated/graphql'

export type Action = 'send' | 'request' | 'stake' | 'lock' | 'vote' | '5G'

type Props = {
  tokenType?: TokenType
  onLayout?: (event: LayoutChangeEvent) => void
}

const AccountActionBar = ({ tokenType, onLayout }: Props) => {
  const navigation = useNavigation<HomeNavigationProp>()
  const { t } = useTranslation()
  const { requirePinForPayment } = useAppStorage()

  const handleAction = useCallback(
    (type: Action) => () => {
      switch (type) {
        case 'send': {
          if (requirePinForPayment) {
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
    [navigation, requirePinForPayment, tokenType],
  )

  return (
    <Box
      flexDirection="row"
      justifyContent="center"
      marginHorizontal="s"
      onLayout={onLayout}
      width="100%"
    >
      <Box flex={1}>
        <FabButton
          icon="fatArrowDown"
          marginLeft="s"
          backgroundColor="greenBright500"
          backgroundColorOpacity={0.2}
          backgroundColorOpacityPressed={0.4}
          iconColor="greenBright500"
          title={t('accountView.request')}
          onPress={handleAction('request')}
        />
      </Box>
      <FabButton
        icon="vote"
        backgroundColor="purple500"
        backgroundColorOpacity={0.3}
        backgroundColorOpacityPressed={0.5}
        onPress={handleAction('vote')}
      />
      <Box flex={1}>
        <FabButton
          icon="fatArrowUp"
          backgroundColor="blueBright500"
          backgroundColorOpacity={0.2}
          backgroundColorOpacityPressed={0.4}
          iconColor="blueBright500"
          title={t('accountView.send')}
          onPress={handleAction('send')}
          reverse
        />
      </Box>
    </Box>
  )
}

export default AccountActionBar
