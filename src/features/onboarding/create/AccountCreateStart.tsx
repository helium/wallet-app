import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import CreateAccount from '@assets/images/createAccount.svg'
import Box from '../../../components/Box'
import Text from '../../../components/Text'
import ButtonPressable from '../../../components/ButtonPressable'
import { useAccountStorage } from '../../../storage/AccountStorageProvider'
import FinePrint from '../../../components/FinePrint'

type Props = { onCreate: () => void }
const AccountCreateStart = ({ onCreate }: Props) => {
  const { t } = useTranslation()
  const { reachedAccountLimit } = useAccountStorage()

  return (
    <Box flex={1} marginHorizontal="lx">
      <Box justifyContent="center" alignItems="center" flex={1}>
        <CreateAccount />
        <Text variant="h2" textAlign="center" lineHeight={34} marginTop="l">
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
        titleColor="greenBright500"
        title={t('accountSetup.createButtonTitle')}
        backgroundColor="surfaceSecondary"
        backgroundColorOpacityPressed={0.7}
        backgroundColorDisabled="surfaceSecondary"
        backgroundColorDisabledOpacity={0.5}
        titleColorDisabled="black500"
        onPress={onCreate}
      />
      <FinePrint marginTop="l" justifyContent="center" />
    </Box>
  )
}

export default memo(AccountCreateStart)
