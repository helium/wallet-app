import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import SafeAreaBox from '@components/SafeAreaBox'
import Text from '@components/Text'
import { useNavigation } from '@react-navigation/native'
import React, { useCallback } from 'react'
import { t } from 'i18next'
import { Image } from 'react-native'
import { AddNewAccountNavigationProp } from '../home/addNewAccount/addNewAccountTypes'

const ConnectKeystoneStart = () => {
  const navigation = useNavigation<AddNewAccountNavigationProp>()
  const handleStart = useCallback(() => {
    navigation.navigate('KeystoneNavigator')
  }, [navigation])
  return (
    <SafeAreaBox
      flex={1}
      justifyContent="center"
      marginHorizontal="l"
      edges={['bottom']}
    >
      <Box flex={1} justifyContent="center">
        <Box alignItems="center">
          <Image
            source={require('../../assets/images/connectKeystoneLogo.png')}
          />
          <Text variant="h0" textAlign="center" marginVertical="l">
            {t('keystone.connectKeystoneStart.title') as string}
          </Text>
          <Text variant="subtitle1" textAlign="center">
            {t('keystone.connectKeystoneStart.subtitle') as string}
          </Text>
        </Box>
      </Box>
      <ButtonPressable
        borderRadius="round"
        onPress={handleStart}
        backgroundColor="primaryText"
        backgroundColorOpacityPressed={0.7}
        backgroundColorDisabled="surfaceSecondary"
        backgroundColorDisabledOpacity={0.5}
        titleColorDisabled="black500"
        titleColor="primary"
        fontWeight="500"
        title={t('keystone.connectKeystoneStart.scanQrCode')}
        marginBottom="l"
      />
    </SafeAreaBox>
  )
}

export default React.memo(ConnectKeystoneStart)
