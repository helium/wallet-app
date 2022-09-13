import React, { useCallback, useMemo } from 'react'
import { SectionList } from 'react-native'
import Balance, {
  DataCredits,
  MobileTokens,
  NetworkTokens,
  SecurityTokens,
  AnyCurrencyType,
} from '@helium/currency'
import { times } from 'lodash'
import { useTranslation } from 'react-i18next'
import { useNavigation } from '@react-navigation/native'
import Arrow from '@assets/images/listItemRight.svg'
import { useAccountBalances } from '../../utils/Balance'
import { AccountData, TokenType } from '../../generated/graphql'
import Box from '../../components/Box'
import Text from '../../components/Text'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import { HomeNavigationProp } from '../home/homeTypes'
import TokenIcon from './TokenIcon'
import { useColors } from '../../theme/themeHooks'
import AccountTokenCurrencyBalance from './AccountTokenCurrencyBalance'

type Token = {
  type: TokenType
  balance: Balance<AnyCurrencyType>
  staked: boolean
}

type Props = {
  accountData: AccountData | null | undefined
  loading?: boolean
  ListHeaderComponent: JSX.Element
}

const AccountTokenList = ({
  accountData,
  loading = false,
  ListHeaderComponent,
}: Props) => {
  const { t } = useTranslation()
  const displayVals = useAccountBalances(accountData)
  const navigation = useNavigation<HomeNavigationProp>()
  const colors = useColors()

  const tokens = useMemo(() => {
    if (loading) {
      return [{ title: t('accountsScreen.tokens'), data: [] }]
    }
    return [
      {
        title: t('accountsScreen.tokens'),
        data: [
          {
            type: TokenType.Hnt,
            balance: displayVals?.hnt as Balance<NetworkTokens>,
            staked: false,
          },
          {
            type: TokenType.Hnt,
            balance: displayVals?.stakedHnt as Balance<NetworkTokens>,
            staked: true,
          },
          {
            type: TokenType.Mobile,
            balance: displayVals?.mobile as Balance<MobileTokens>,
            staked: false,
          },
          {
            type: TokenType.Dc,
            balance: displayVals?.dc as Balance<DataCredits>,
            staked: false,
          },
          {
            type: TokenType.Hst,
            balance: displayVals?.hst as Balance<SecurityTokens>,
            staked: false,
          },
        ].filter(
          (token) =>
            token?.balance?.integerBalance > 0 ||
            token?.type === TokenType.Mobile ||
            (token?.type === TokenType.Hnt && token?.staked === false),
        ),
      },
    ]
  }, [displayVals, loading, t])

  const handleNavigation = useCallback(
    (token: Token) => () => {
      navigation.navigate('AccountTokenScreen', { tokenType: token.type })
    },
    [navigation],
  )

  const renderSectionHeader = useCallback(({ section: { title } }) => {
    return (
      <Box
        backgroundColor="primaryBackground"
        paddingHorizontal="l"
        paddingVertical="m"
      >
        <Text variant="h4" color="white">
          {title}
        </Text>
      </Box>
    )
  }, [])

  const renderItem = useCallback(
    ({ item: token }) => {
      return (
        <TouchableOpacityBox
          onPress={handleNavigation(token)}
          flexDirection="row"
          alignItems="center"
          paddingHorizontal="l"
          paddingVertical="m"
          borderBottomColor="primaryBackground"
          borderBottomWidth={1}
        >
          <TokenIcon tokenType={token.type} />
          <Box flex={1} paddingHorizontal="m">
            <Text variant="body1" color="white">
              {token?.balance?.toString(2)}
              {token.staked ? ' Staked' : ''}
            </Text>
            <AccountTokenCurrencyBalance
              variant="subtitle4"
              color="secondaryText"
              accountData={accountData}
              tokenType={token.type}
              staked={token.staked}
            />
          </Box>
          <Arrow color="gray400" />
        </TouchableOpacityBox>
      )
    },
    [accountData, handleNavigation],
  )

  const renderSectionFooter = useCallback(() => {
    if (!loading) return null
    return <>{times(3).map((i) => renderSkeletonItem(i))}</>
  }, [loading])

  const renderSkeletonItem = (key: number) => {
    return (
      <Box
        key={key}
        flexDirection="row"
        alignItems="center"
        paddingHorizontal="l"
        paddingVertical="l"
        borderBottomColor="primaryBackground"
        borderBottomWidth={1}
      >
        <Box
          width={40}
          height={40}
          borderRadius="round"
          backgroundColor="surface"
        />
        <Box flex={1} paddingHorizontal="m">
          <Box width={120} height={16} backgroundColor="surface" />
          <Box width={70} height={16} marginTop="s" backgroundColor="surface" />
        </Box>
        <Arrow color="gray400" />
      </Box>
    )
  }

  const keyExtractor = useCallback((item: Token) => {
    if (item.staked) {
      return [item.type, 'staked'].join('-')
    }
    return item.type
  }, [])

  return (
    <Box backgroundColor="surfaceSecondary" flex={1}>
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        backgroundColor="primaryBackground"
        height={300}
      />
      <SectionList
        ListHeaderComponent={ListHeaderComponent}
        sections={tokens}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        renderSectionFooter={renderSectionFooter}
        keyExtractor={keyExtractor}
        contentContainerStyle={{
          backgroundColor: colors.surfaceSecondary,
          paddingBottom: 60,
        }}
      />
    </Box>
  )
}

export default AccountTokenList
