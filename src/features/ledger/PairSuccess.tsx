import { useNavigation } from '@react-navigation/native'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { withUniwind } from 'uniwind'
import Ledger from '@assets/images/ledger.svg'
import { Button } from '@ui/Button'
import { Text } from '@ui/Text'
import { LedgerNavigatorNavigationProp } from './ledgerNavigatorTypes'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { RootNavigationProp } from '../../navigation/rootTypes'

const LedgerIcon = withUniwind(Ledger)

const PairSuccess = () => {
  const { t } = useTranslation()
  const navigation = useNavigation<LedgerNavigatorNavigationProp>()
  const rootNav = useNavigation<RootNavigationProp>()
  const { hasAccounts } = useAccountStorage()

  const next = () => {
    if (hasAccounts) {
      rootNav.reset({
        index: 0,
        routes: [
          {
            name: 'TabBarNavigator',
          },
        ],
      })
    } else {
      navigation.navigate('DeviceScan', undefined, { pop: true })
    }
  }

  return (
    <View className="mt-6 flex-1 bg-background px-6">
      <View className="flex-1 justify-center">
        <View className="items-center">
          <LedgerIcon
            width={62}
            height={62}
            colorClassName="accent-foreground"
          />
          <Text size="4xl" className="my-6">
            {t('ledger.success.title')}
          </Text>
          <Text
            size="xl"
            className="text-center font-medium text-muted-foreground"
          >
            {t('ledger.success.subtitle')}
          </Text>
        </View>
      </View>
      <Button variant="cta" size="lg" className="mb-4 w-full" onPress={next}>
        {t('ledger.success.next')}
      </Button>
    </View>
  )
}

export default PairSuccess
