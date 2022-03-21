import React from 'react'
import { useTranslation } from 'react-i18next'
import CreateAccount from '@assets/images/createAccount.svg'
import Box from '../../../components/Box'
import Text from '../../../components/Text'
import ButtonPressable from '../../../components/ButtonPressable'

type Props = { onCreate: () => void }
const AccountCreateStart = ({ onCreate }: Props) => {
  const { t } = useTranslation()

  return (
    <Box flex={1} marginHorizontal="lx">
      <Box justifyContent="center" alignItems="center" flex={1}>
        <CreateAccount />
        <Text variant="h2" textAlign="center" lineHeight={34} marginTop="l">
          {t('accountSetup.title')}
        </Text>
        <Text
          variant="body1"
          fontSize={21}
          lineHeight={23}
          textAlign="center"
          color="secondaryText"
          marginVertical="m"
        >
          {t('accountSetup.subtitle1')}
        </Text>
        <Text
          variant="body1"
          fontSize={21}
          lineHeight={23}
          textAlign="center"
          color="greenBright500"
        >
          {t('accountSetup.subtitle2')}
        </Text>
      </Box>
      <ButtonPressable
        height={60}
        marginBottom="m"
        borderRadius="round"
        borderBottomRightRadius="round"
        backgroundColor="surfaceSecondary"
        backgroundColorPressed="surface"
        titleColor="greenBright500"
        title={t('accountSetup.createButtonTitle')}
        onPress={onCreate}
      />
    </Box>
  )
}

export default AccountCreateStart
