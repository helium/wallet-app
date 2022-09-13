import React, { useCallback, useState, useMemo } from 'react'
import { useNavigation } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import { NetTypes } from '@helium/address'
import { useAppStorage } from '../../storage/AppStorageProvider'
import * as AccountUtils from '../../utils/accountUtils'
import Box from '../../components/Box'
import FabButton from '../../components/FabButton'
import { HomeNavigationProp } from '../home/homeTypes'
import {
  AccountData,
  TokenType,
  useFeatureFlagsQuery,
} from '../../generated/graphql'
import ActionSheet from '../../components/ActionSheet'

export type Action =
  | 'send'
  | 'request'
  | 'stake'
  | 'lock'
  | 'vote'
  | '5G'
  | 'internet'

type Props = {
  accountData: AccountData | null | undefined
  tokenType?: TokenType
}

const AccountActionBar = ({ accountData, tokenType }: Props) => {
  const navigation = useNavigation<HomeNavigationProp>()
  const { t } = useTranslation()
  const [actionSheetOpen, setActionSheetOpen] = useState(false)
  const { requirePinForPayment } = useAppStorage()
  const { data: featureFlagData } = useFeatureFlagsQuery({
    variables: {
      address: accountData?.address || '',
    },
    fetchPolicy: 'cache-and-network',
    skip: !accountData?.address,
  })

  const accountNetType = useMemo(
    () => AccountUtils.accountNetType(accountData?.address),
    [accountData],
  )

  const handleAction = useCallback(
    (type: Action) => () => {
      setActionSheetOpen(false)

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
        case 'internet': {
          // navigation.navigate('InternetOnboard')
          // setShowInternetProviders(true)
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

  const toggleActionSheet = useCallback(() => {
    setActionSheetOpen(!actionSheetOpen)
  }, [actionSheetOpen])

  const actions = useMemo(() => {
    const visibleActions = []

    if (accountNetType === NetTypes.MAINNET && tokenType !== TokenType.Mobile) {
      visibleActions.push(
        <FabButton
          icon="vote"
          backgroundColor="purple500"
          backgroundColorOpacity={0.2}
          backgroundColorOpacityPressed={0.4}
          iconColor="purple500"
          title={t('accountView.vote')}
          onPress={handleAction('vote')}
        />,
      )
    }

    if (featureFlagData?.featureFlags.wifiEnabled) {
      visibleActions.push(
        <FabButton
          icon="payment"
          marginLeft="s"
          backgroundColor="orange500"
          backgroundColorOpacity={0.2}
          backgroundColorOpacityPressed={0.4}
          iconColor="orange500"
          title={t('accountView.internet')}
          onPress={handleAction('internet')}
        />,
      )
    }

    if (featureFlagData?.featureFlags.mobileEnabled) {
      visibleActions.push(
        <FabButton
          icon="payment"
          marginLeft="s"
          backgroundColor="orange500"
          backgroundColorOpacity={0.2}
          backgroundColorOpacityPressed={0.4}
          iconColor="orange500"
          title={t('accountView.fiveG')}
          onPress={handleAction('5G')}
        />,
      )
    }

    // TODO add logic to enable these when desired
    // if () {
    //   visibleActions.push(
    //     <FabButton
    //       icon="lock"
    //       marginLeft="s"
    //       backgroundColor="red500"
    //       backgroundColorOpacity={0.2}
    //       backgroundColorOpacityPressed={0.4}
    //       iconColor="red500"
    //       title={t('accountView.lock')}
    //       onPress={handleAction('lock')}
    //     />,
    //   )
    // }

    // if () {
    //   visibleActions.push(
    //     <FabButton
    //       icon="stake"
    //       marginLeft="s"
    //       backgroundColor="purple500"
    //       backgroundColorOpacity={0.2}
    //       backgroundColorOpacityPressed={0.4}
    //       iconColor="purple500"
    //       title={t('accountView.stake')}
    //       onPress={handleAction('stake')}
    //     />,
    //   )
    // }

    return visibleActions
  }, [accountNetType, featureFlagData, handleAction, t, tokenType])

  return (
    <>
      <Box
        flexDirection="row"
        justifyContent="center"
        marginTop="xl"
        marginBottom="l"
        marginHorizontal="s"
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
        {actions.length > 0 && (
          <FabButton
            icon="dots"
            backgroundColor="surface"
            backgroundColorOpacity={0.2}
            backgroundColorOpacityPressed={0.4}
            onPress={toggleActionSheet}
          />
        )}
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
      <ActionSheet
        open={actionSheetOpen}
        onClose={toggleActionSheet}
        actions={actions}
      />
    </>
  )
}

export default AccountActionBar
