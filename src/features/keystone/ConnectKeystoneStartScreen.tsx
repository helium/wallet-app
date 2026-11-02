import { useNavigation } from '@react-navigation/native'
import { Button } from '@ui/Button'
import { Text } from '@ui/Text'
import React from 'react'
import { t } from 'i18next'
import { View } from 'react-native'
import { Image } from '@ui/Image'
import { SafeAreaView } from 'react-native-safe-area-context'
import { withUniwind } from 'uniwind'
import { AddNewAccountNavigationProp } from '../home/addNewAccount/addNewAccountTypes'

const SafeArea = withUniwind(SafeAreaView)

const ConnectKeystoneStart = () => {
  const navigation = useNavigation<AddNewAccountNavigationProp>()
  const handleStart = () => {
    navigation.navigate('KeystoneNavigator')
  }
  return (
    <SafeArea className="mx-6 flex-1 justify-center" edges={['bottom']}>
      <View className="flex-1 justify-center">
        <View className="items-center">
          <Image
            source={require('../../assets/images/connectKeystoneLogo.png')}
          />
          <Text size="4xl" className="my-6 text-center">
            {t('keystone.connectKeystoneStart.title') as string}
          </Text>
          <Text size="xl" className="text-center font-medium">
            {t('keystone.connectKeystoneStart.subtitle') as string}
          </Text>
        </View>
      </View>
      <Button
        variant="cta"
        size="lg"
        className="mb-6 w-full"
        onPress={handleStart}
      >
        {t('keystone.connectKeystoneStart.scanQrCode')}
      </Button>
    </SafeArea>
  )
}

export default ConnectKeystoneStart
