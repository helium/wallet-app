import React, { memo, useCallback } from 'react'
import { useColors } from '@config/theme/themeHooks'
import { useTranslation } from 'react-i18next'
import CreateAccount from '@assets/svgs/createAccount.svg'
import { useNavigation } from '@react-navigation/native'
import Box from '@components/Box'
import Text from '@components/Text'
import ButtonPressable from '@components/ButtonPressable'
import CloseButton from '@components/CloseButton'
import SafeAreaBox from '@components/SafeAreaBox'
import { useAccountStorage } from '@config/storage/AccountStorageProvider'
import { CreateAccountNavigationProp } from './createAccountNavTypes'

type Props = { onCreate: () => void; inline?: boolean }
const AccountCreateStart = ({ onCreate, inline }: Props) => {
  const { t } = useTranslation()
  const { reachedAccountLimit } = useAccountStorage()
  const navigation = useNavigation<CreateAccountNavigationProp>()
  const colors = useColors()

  const onClose = useCallback(() => {
    navigation.goBack()
  }, [navigation])

  return (
    <SafeAreaBox
      flex={1}
      backgroundColor="primaryBackground"
      paddingHorizontal="6"
    >
      <Box width="100%" alignItems="flex-end" visible={!inline}>
        <CloseButton onPress={onClose} />
      </Box>
      <Box justifyContent="center" alignItems="center" flex={1}>
        <CreateAccount color={colors['green.light-500']} />
        <Text
          variant="displayMdRegular"
          fontSize={44}
          textAlign="center"
          lineHeight={44}
          marginTop="6"
          color="primaryText"
        >
          {t('accountSetup.title')}
        </Text>
        <Text
          variant="textXlMedium"
          textAlign="center"
          color="secondaryText"
          marginVertical="4"
        >
          {t('accountSetup.subtitle1')}
        </Text>
        <Text
          variant="textXlMedium"
          textAlign="center"
          color="green.light-500"
          visible={!reachedAccountLimit}
        >
          {t('accountSetup.subtitle2')}
        </Text>
      </Box>
      <Text
        visible={reachedAccountLimit}
        variant="textMdRegular"
        textAlign="center"
        color="error.500"
        fontWeight="500"
        marginBottom="6"
      >
        {t('accountImport.accountLimit')}
      </Text>
      <ButtonPressable
        disabled={reachedAccountLimit}
        borderRadius="full"
        titleColor="base.black"
        fontWeight="500"
        title={t('accountSetup.createButtonTitle')}
        backgroundColor="green.light-500"
        backgroundColorOpacityPressed={0.7}
        backgroundColorDisabled="bg.tertiary"
        backgroundColorDisabledOpacity={0.5}
        titleColorDisabled="gray.800"
        marginBottom="6"
        onPress={onCreate}
      />
    </SafeAreaBox>
  )
}

export default memo(AccountCreateStart)
