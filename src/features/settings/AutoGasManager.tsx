import { HNT_MINT, IOT_MINT, MOBILE_MINT } from '@helium/spl-utils'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import { useNavigation } from '@react-navigation/native'
import { PublicKey } from '@solana/web3.js'
import { useAppStorage } from '@storage/AppStorageProvider'
import { useVisibleTokens } from '@storage/TokensProvider'
import { Button } from '@ui/Button'
import { PressableScale } from '@ui/PressableScale'
import { Text } from '@ui/Text'
import { TokenIcon } from '@ui/TokenIcon'
import React, { FC, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Switch, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { twMerge } from '@ui/twMerge'
import SettingsBackHeader from './SettingsBackHeader'

const TokenOption = ({
  mint,
  isActive,
  onPress,
}: {
  mint: PublicKey
  isActive: boolean
  onPress: () => void
}) => {
  const { symbol, json } = useMetaplexMetadata(mint)
  return (
    <PressableScale
      feedback="opacity"
      onPress={onPress}
      className={twMerge(
        'flex-row items-center gap-2 rounded-full py-1.5 pl-1.5 pr-4',
        isActive ? 'bg-secondary' : 'bg-black',
      )}
    >
      <TokenIcon size={30} img={json?.image} />
      <Text className="font-semibold">{symbol}</Text>
    </PressableScale>
  )
}

const AutoGasManager: FC = () => {
  const { visibleTokens } = useVisibleTokens()
  const navigation = useNavigation()
  const { bottom } = useSafeAreaInsets()
  const validInputMints = useMemo(
    () =>
      [HNT_MINT, MOBILE_MINT, IOT_MINT].filter((key) =>
        visibleTokens.has(key.toBase58()),
      ),
    [visibleTokens],
  )
  const { autoGasManagementToken, updateAutoGasManagementToken } =
    useAppStorage()
  const { t } = useTranslation()
  const [inputMint, setInputMint] = useState<PublicKey | undefined>(
    autoGasManagementToken,
  )
  const handleSave = async () => {
    await updateAutoGasManagementToken(inputMint)
    navigation.goBack()
  }

  return (
    <View className="flex-1 bg-background" style={{ paddingBottom: bottom }}>
      <SettingsBackHeader onBack={navigation.goBack} />
      <Text size="lg" className="px-4 pt-2 text-center font-semibold">
        {t('settings.autoGasManagement.title')}
      </Text>
      <View className="mt-6 flex-1 px-4">
        <Text className="text-center text-muted-foreground">
          {t('settings.autoGasManagement.body')}
        </Text>

        <View className="mb-6 mt-10 flex-row items-center px-4">
          <Switch
            value={!!inputMint}
            trackColorOnClassName="accent-purple-500"
            trackColorOffClassName="accent-secondary"
            thumbColorClassName="accent-white"
            onValueChange={() => setInputMint(inputMint ? undefined : HNT_MINT)}
          />
          <Text className="ml-4">
            {t('settings.autoGasManagement.enabled')}
          </Text>
        </View>

        {inputMint && (
          <View>
            <Text className="text-center text-muted-foreground">
              {t('settings.autoGasManagement.selectTokenBody')}
            </Text>
            <View className="mt-4 flex-row justify-between">
              {validInputMints.map((mint) => (
                <TokenOption
                  key={mint.toBase58()}
                  mint={mint}
                  isActive={inputMint.equals(mint)}
                  onPress={() => setInputMint(mint)}
                />
              ))}
            </View>
          </View>
        )}
      </View>

      <View className="mx-4 mb-4 flex-row gap-3">
        <Button
          variant="secondary"
          size="lg"
          className="flex-1"
          onPress={navigation.goBack}
        >
          {t('generic.cancel')}
        </Button>
        <Button
          variant="cta"
          size="lg"
          className="flex-1"
          onPress={() => void handleSave().catch(console.error)}
        >
          {t('generic.save')}
        </Button>
      </View>
    </View>
  )
}

export default AutoGasManager
