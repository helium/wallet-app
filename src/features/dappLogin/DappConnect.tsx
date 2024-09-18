import React, { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import Crowdspot from '@assets/images/crowdspot.svg'
import AddDapp from '@assets/images/addDapp.svg'
import Box from '@components/Box'
import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { useColors } from '@theme/themeHooks'

type Props = { appName: string; onApprove: () => void; onDeny: () => void }
const DappConnect = ({ appName, onApprove, onDeny }: Props) => {
  const { t } = useTranslation()
  const { primaryText } = useColors()

  const isCrowdspot = useMemo(
    () => appName.toLowerCase() === 'crowdspot',
    [appName],
  )

  return (
    <Box alignItems="center" flex={1} flexDirection="column">
      <Box flex={1} />
      {isCrowdspot ? (
        <Crowdspot height={193} width={193} />
      ) : (
        <AddDapp color={primaryText} height={145} width={145} />
      )}
      <Text variant="displayLgRegular" textAlign="center" marginTop="6">
        {t('dappLogin.connect.title', { appName })}
      </Text>
      <Text
        variant="textXlMedium"
        textAlign="center"
        marginTop="2"
        color="secondaryText"
      >
        {t('dappLogin.connect.subtitle', { appName })}
      </Text>

      <Box flex={1} />
      <Box flexDirection="row" marginTop="6">
        <TouchableOpacityBox
          flex={1}
          minHeight={66}
          justifyContent="center"
          marginEnd="4"
          borderRadius="full"
          overflow="hidden"
          backgroundColor="secondaryText"
          onPress={onDeny}
        >
          <Text variant="textXlMedium" textAlign="center" color="primaryText">
            {t('generic.cancel')}
          </Text>
        </TouchableOpacityBox>
        <TouchableOpacityBox
          flex={1}
          minHeight={66}
          backgroundColor="primaryBackground"
          justifyContent="center"
          alignItems="center"
          onPress={onApprove}
          borderRadius="full"
          flexDirection="row"
        >
          <Text
            marginLeft="2"
            variant="textXlMedium"
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
