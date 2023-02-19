/* eslint-disable react/jsx-props-no-spreading */
import React, { memo, useCallback } from 'react'
import { Linking, TouchableOpacity } from 'react-native'
import { useTranslation } from 'react-i18next'
import { BoxProps } from '@shopify/restyle'
import { Theme } from '@theme/theme'
import Text from './Text'
import { PRIVACY_POLICY, TERMS_OF_SERVICE } from '../constants/urls'
import Box from './Box'

type Props = BoxProps<Theme>

const FinePrint = (boxProps: Props) => {
  const { t } = useTranslation()
  const onPressPrivacyPolicy = useCallback(
    () => Linking.openURL(PRIVACY_POLICY),
    [],
  )
  const onPressTOS = useCallback(() => Linking.openURL(TERMS_OF_SERVICE), [])
  return (
    <Box {...boxProps} flexDirection="row" flexWrap="wrap">
      <Text variant="body2" color="secondaryText">
        {t('finePrint.body')}{' '}
      </Text>
      <TouchableOpacity onPress={onPressTOS}>
        <Text color="blueBright500">
          {t('settings.sections.finePrint.termsOfService')}{' '}
        </Text>
      </TouchableOpacity>
      <Text variant="body2" color="secondaryText">
        {t('generic.and')}{' '}
      </Text>
      <TouchableOpacity onPress={onPressPrivacyPolicy}>
        <Text color="blueBright500">
          {t('settings.sections.finePrint.privacyPolicy')}
        </Text>
      </TouchableOpacity>
      <Text variant="body2" color="secondaryText">
        {t('generic.period')}
      </Text>
    </Box>
  )
}

export default memo(FinePrint)
