import React from 'react'
import Ledger from '@assets/images/ledger.svg'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { Edge, SafeAreaView } from 'react-native-safe-area-context'
import { withUniwind } from 'uniwind'
import { useNavigation } from '@react-navigation/native'
import { Button } from '@ui/Button'
import { Text } from '@ui/Text'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { AddNewAccountNavigationProp } from '../home/addNewAccount/addNewAccountTypes'

const SafeArea = withUniwind(SafeAreaView)
const LedgerIcon = withUniwind(Ledger)

const EDGES: Edge[] = ['bottom']

const PairStart = () => {
  const { t } = useTranslation()
  const navigation = useNavigation<AddNewAccountNavigationProp>()
  const { reachedAccountLimit } = useAccountStorage()

  const handleStart = () => {
    navigation.navigate('LedgerNavigator')
  }

  return (
    <SafeArea edges={EDGES} className="mx-6 flex-1 justify-center">
      <View className="flex-1 justify-center">
        <View className="items-center">
          <LedgerIcon
            colorClassName="accent-foreground"
            height={61}
            width={61}
          />
          <Text size="4xl" className="my-6 text-center">
            {t('ledger.pairStart.title')}
          </Text>
          <Text size="xl" className="text-center font-medium">
            {t('ledger.pairStart.subtitle')}
          </Text>
        </View>
      </View>
      {reachedAccountLimit && (
        <Text
          size="base"
          className="mx-6 mb-6 text-center font-medium text-destructive"
        >
          {t('accountImport.accountLimit')}
        </Text>
      )}
      <Button
        variant="cta"
        size="lg"
        className="mb-6 w-full"
        disabled={reachedAccountLimit}
        onPress={handleStart}
      >
        {t('ledger.pairStart.pair')}
      </Button>
    </SafeArea>
  )
}

export default PairStart
