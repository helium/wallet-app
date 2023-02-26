import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigation } from '@react-navigation/native'
import Ledger from '@assets/images/ledger.svg'
import Text from '@components/Text'
import Box from '@components/Box'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { useColors } from '@theme/themeHooks'
import SafeAreaBox from '@components/SafeAreaBox'
import { LedgerNavigatorNavigationProp } from './ledgerNavigatorTypes'

const DeviceChooseType = () => {
  const { t } = useTranslation()
  const { primaryText } = useColors()
  const navigation = useNavigation<LedgerNavigatorNavigationProp>()

  const navNext = useCallback(
    (type: 'usb' | 'bluetooth') => () => {
      switch (type) {
        case 'bluetooth':
          navigation.navigate('DeviceScan')
          break
        case 'usb':
          navigation.navigate('DeviceScanUsb')
          break
      }
    },
    [navigation],
  )

  return (
    <SafeAreaBox
      flex={1}
      backgroundColor="primaryBackground"
      marginTop="l"
      paddingHorizontal="xl"
    >
      <Text variant="h1" textAlign="center" lineHeight={38} marginVertical="xl">
        {t('ledger.chooseType.title')}
      </Text>
      <TouchableOpacityBox
        onPress={navNext('bluetooth')}
        marginBottom="l"
        flexDirection="row"
        alignItems="center"
      >
        <Ledger width={26} height={26} color={primaryText} />
        <Box marginLeft="ms">
          <Text
            variant="subtitle1"
            color="primaryText"
            fontSize={21}
            lineHeight={23}
          >
            {t('ledger.chooseType.bluetooth.title')}
          </Text>
          <Text variant="body1" color="secondaryText">
            {t('ledger.chooseType.bluetooth.types')}
          </Text>
        </Box>
      </TouchableOpacityBox>
      <TouchableOpacityBox
        onPress={navNext('usb')}
        marginBottom="l"
        flexDirection="row"
        alignItems="center"
      >
        <Ledger width={26} height={26} color={primaryText} />
        <Box marginLeft="ms">
          <Text
            variant="subtitle1"
            color="primaryText"
            fontSize={21}
            lineHeight={23}
          >
            {t('ledger.chooseType.usb.title')}
          </Text>
          <Text variant="body1" color="secondaryText">
            {t('ledger.chooseType.usb.types')}
          </Text>
        </Box>
      </TouchableOpacityBox>
    </SafeAreaBox>
  )
}

export default DeviceChooseType
