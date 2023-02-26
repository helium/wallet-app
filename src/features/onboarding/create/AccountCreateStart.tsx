import React, { memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import CreateAccount from '@assets/images/createAccount.svg'
import { useNavigation } from '@react-navigation/native'
import Box from '@components/Box'
import Text from '@components/Text'
import ButtonPressable from '@components/ButtonPressable'
import CloseButton from '@components/CloseButton'
import SafeAreaBox from '@components/SafeAreaBox'
import { useAccountStorage } from '../../../storage/AccountStorageProvider'
import { CreateAccountNavigationProp } from './createAccountNavTypes'

type Props = { onCreate: () => void; inline?: boolean }
const AccountCreateStart = ({ onCreate, inline }: Props) => {
  const { t } = useTranslation()
  const { reachedAccountLimit } = useAccountStorage()
  const navigation = useNavigation<CreateAccountNavigationProp>()

  const onClose = useCallback(() => {
    navigation.goBack()
  }, [navigation])

  return (
    <SafeAreaBox
      flex={1}
      backgroundColor="secondaryBackground"
      paddingHorizontal="l"
    >
      <Box width="100%" alignItems="flex-end" visible={!inline}>
        <CloseButton onPress={onClose} />
      </Box>
      <Box justifyContent="center" alignItems="center" flex={1}>
        <CreateAccount />
        <Text
          variant="h1"
          fontSize={44}
          textAlign="center"
          lineHeight={44}
          marginTop="l"
        >
          {t('accountSetup.title')}
        </Text>
        <Text
          variant="subtitle1"
          textAlign="center"
          color="secondaryText"
          marginVertical="m"
        >
          {t('accountSetup.subtitle1')}
        </Text>
        <Text
          variant="subtitle1"
          textAlign="center"
          color="greenBright500"
          visible={!reachedAccountLimit}
        >
          {t('accountSetup.subtitle2')}
        </Text>
      </Box>
      <Text
        visible={reachedAccountLimit}
        variant="body1"
        textAlign="center"
        color="error"
        fontWeight="500"
        marginBottom="l"
      >
        {t('accountImport.accountLimit')}
      </Text>
      <ButtonPressable
        disabled={reachedAccountLimit}
        borderRadius="round"
        titleColor="secondary"
        fontWeight="500"
        title={t('accountSetup.createButtonTitle')}
        backgroundColor="greenBright500"
        backgroundColorOpacityPressed={0.7}
        backgroundColorDisabled="surfaceSecondary"
        backgroundColorDisabledOpacity={0.5}
        titleColorDisabled="black500"
        marginBottom="l"
        onPress={onCreate}
      />
    </SafeAreaBox>
  )
}

export default memo(AccountCreateStart)
