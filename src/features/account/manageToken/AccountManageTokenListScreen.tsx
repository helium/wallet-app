import { useNavigation } from '@react-navigation/native'
import React, { useCallback, useMemo } from 'react'
import Close from '@assets/images/close.svg'
import { Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import Plus from '@assets/images/plus.svg'
import { FlatList } from 'react-native-gesture-handler'
import Box from '../../../components/Box'
import Text from '../../../components/Text'
import { HomeNavigationProp } from '../../home/homeTypes'
import IconPressedContainer from '../../../components/IconPressedContainer'
import { useColors, useHitSlop } from '../../../theme/themeHooks'
import TokenListItem from '../TokenListItem'
import { Token, useTokens } from '../../../storage/TokensProvider'

const AccountManageTokenListScreen: React.FC = () => {
  const navigation = useNavigation<HomeNavigationProp>()
  const { primaryText } = useColors()
  const { top } = useSafeAreaInsets()
  const hitSlop = useHitSlop('l')
  const { t } = useTranslation()
  const { tokens, handleUpdateTokens, isActiveToken } = useTokens()

  const containerStyle = useMemo(
    () => ({ marginTop: Platform.OS === 'android' ? top : undefined }),
    [top],
  )

  const renderItem = useCallback(
    // eslint-disable-next-line react/no-unused-prop-types
    ({ index, item: token }: { index: number; item: Token }) => {
      return (
        <TokenListItem
          ticker={token.type}
          balance={token.balance}
          staked={token.staked}
          withoutBorderBottom={index === tokens.length - 1}
          checked={isActiveToken(token)}
          onCheckedChange={(value) => handleUpdateTokens(token, value)}
        />
      )
    },
    [handleUpdateTokens, isActiveToken, tokens.length],
  )

  const keyExtractor = useCallback((item: Token | string) => {
    if (typeof item === 'string') {
      return item
    }
    const currencyToken = item as Token

    if (currencyToken.staked) {
      return [currencyToken.type, 'staked'].join('-')
    }
    return currencyToken.type
  }, [])

  return (
    <Box
      style={containerStyle}
      flex={1}
      borderTopStartRadius="xl"
      borderTopEndRadius="xl"
      backgroundColor="surfaceSecondary"
    >
      <Box
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
        borderTopStartRadius="xl"
        borderTopEndRadius="xl"
        marginBottom="m"
      >
        <Box hitSlop={hitSlop} padding="s">
          <IconPressedContainer
            onPress={navigation.goBack}
            activeOpacity={0.75}
            idleOpacity={1.0}
          >
            <Close color={primaryText} height={16} width={16} />
          </IconPressedContainer>
        </Box>
        <Text
          variant="subtitle2"
          textAlign="center"
          color="primaryText"
          maxFontSizeMultiplier={1}
        >
          {t('accountTokenList.manage')}
        </Text>
        <Box hitSlop={hitSlop} padding="s">
          <IconPressedContainer
            onPress={() => navigation.navigate('AccountManageTokenAddScreen')}
            activeOpacity={0.75}
            idleOpacity={1.0}
          >
            <Plus color={primaryText} height={20} width={20} />
          </IconPressedContainer>
        </Box>
      </Box>

      <FlatList
        data={tokens}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
      />
    </Box>
  )
}

export default AccountManageTokenListScreen
