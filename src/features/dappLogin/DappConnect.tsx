import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import Crowdspot from '@assets/images/crowdspot.svg'
import Box from '../../components/Box'
import Text from '../../components/Text'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'

type Props = { appName: string; onApprove: () => void; onDeny: () => void }
const DappConnect = ({ appName, onApprove, onDeny }: Props) => {
  const { t } = useTranslation()

  return (
    <Box alignItems="center" flex={1} flexDirection="column">
      <Box flex={1} />
      <Crowdspot height={193} width={193} />
      <Text variant="h0" textAlign="center" marginTop="l">
        {t('dappLogin.connect.title', { name: appName })}
      </Text>
      <Text
        variant="subtitle1"
        textAlign="center"
        marginTop="s"
        color="secondaryText"
      >
        {t('dappLogin.connect.subtitle', { name: appName })}
      </Text>

      <Box flex={1} />
      <Box flexDirection="row" marginTop="l">
        <TouchableOpacityBox
          flex={1}
          minHeight={66}
          justifyContent="center"
          marginEnd="m"
          borderRadius="round"
          overflow="hidden"
          backgroundColor="secondaryIcon"
          onPress={onDeny}
        >
          <Text variant="subtitle1" textAlign="center" color="primaryText">
            {t('generic.cancel')}
          </Text>
        </TouchableOpacityBox>
        <TouchableOpacityBox
          flex={1}
          minHeight={66}
          backgroundColor="surfaceContrast"
          justifyContent="center"
          alignItems="center"
          onPress={onApprove}
          borderRadius="round"
          flexDirection="row"
        >
          <Text
            marginLeft="s"
            variant="subtitle1"
            textAlign="center"
            color="secondary"
          >
            {t('dappLogin.connect.continue')}
          </Text>
        </TouchableOpacityBox>
      </Box>
    </Box>
  )
}

export default memo(DappConnect)
