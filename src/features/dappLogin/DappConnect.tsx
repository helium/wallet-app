import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { withUniwind } from 'uniwind'
import Crowdspot from '@assets/images/crowdspot.svg'
import AddDapp from '@assets/images/addDapp.svg'
import { Button } from '@ui/Button'
import { Text } from '@ui/Text'

const AddDappArt = withUniwind(AddDapp)

type Props = { appName: string; onApprove: () => void; onDeny: () => void }
const DappConnect = ({ appName, onApprove, onDeny }: Props) => {
  const { t } = useTranslation()

  const isCrowdspot = appName.toLowerCase() === 'crowdspot'

  return (
    <View className="flex-1 flex-col items-center">
      <View className="flex-1" />
      {isCrowdspot ? (
        <Crowdspot height={193} width={193} />
      ) : (
        <AddDappArt
          colorClassName="accent-foreground"
          height={145}
          width={145}
        />
      )}
      <Text size="4xl" className="mt-6 text-center">
        {t('dappLogin.connect.title', { appName })}
      </Text>
      <Text
        size="xl"
        className="mt-2 text-center font-medium text-muted-foreground"
      >
        {t('dappLogin.connect.subtitle', { appName })}
      </Text>

      <View className="flex-1" />
      <View className="mt-6 w-full flex-row gap-4">
        <Button variant="outline" size="lg" className="flex-1" onPress={onDeny}>
          {t('generic.cancel')}
        </Button>
        <Button variant="cta" size="lg" className="flex-1" onPress={onApprove}>
          {t('dappLogin.connect.continue')}
        </Button>
      </View>
    </View>
  )
}

export default DappConnect
