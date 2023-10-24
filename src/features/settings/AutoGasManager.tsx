import BackScreen from '@components/BackScreen'
import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import Text from '@components/Text'
import TokenPill from '@components/TokenPill'
import { HNT_MINT, IOT_MINT, MOBILE_MINT } from '@helium/spl-utils'
import { useNavigation } from '@react-navigation/native'
import { PublicKey } from '@solana/web3.js'
import { useAppStorage } from '@storage/AppStorageProvider'
import { useVisibleTokens } from '@storage/TokensProvider'
import React, { FC, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Switch } from 'react-native'

const AutoGasManager: FC = () => {
  const { visibleTokens } = useVisibleTokens()
  const navigation = useNavigation()
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
  const onMintSelect = useCallback(
    (mint: PublicKey | undefined) => () => {
      setInputMint(mint)
    },
    [],
  )
  const handleSave = useCallback(async () => {
    await updateAutoGasManagementToken(inputMint)
    navigation.goBack()
  }, [updateAutoGasManagementToken, inputMint, navigation])

  return (
    <BackScreen backgroundColor="primaryBackground" flex={1}>
      <Box flexDirection="column" flex={1}>
        <Box
          flexDirection="row"
          alignItems="center"
          justifyContent="center"
          paddingTop="s"
          paddingHorizontal="m"
        >
          <Text variant="h4" color="white" flex={1} textAlign="center">
            {t('settings.autoGasManagement.title')}
          </Text>
        </Box>
        <Box flex={1} paddingHorizontal="m" marginTop="l">
          <Text
            variant="body1Medium"
            color="white"
            opacity={0.6}
            textAlign="center"
          >
            {t('settings.autoGasManagement.body')}
          </Text>

          <Box
            flexDirection="row"
            paddingHorizontal="m"
            marginBottom="l"
            marginTop="xxl"
            alignItems="center"
          >
            <Switch
              value={!!inputMint}
              trackColor={{ false: 'secondaryText', true: 'blueBright500' }}
              thumbColor="primaryBackground"
              onValueChange={
                inputMint ? onMintSelect(undefined) : onMintSelect(HNT_MINT)
              }
            />
            <Text ml="m" color="white">
              {t('settings.autoGasManagement.enabled')}
            </Text>
          </Box>

          {inputMint && (
            <Box flexDirection="column">
              <Text
                variant="body1Medium"
                color="white"
                opacity={0.6}
                textAlign="center"
              >
                {t('settings.autoGasManagement.selectTokenBody')}
              </Text>
              <Box flexDirection="row" justifyContent="space-between" mt="m">
                {validInputMints.map((mint) => (
                  <TokenPill
                    key={mint.toBase58()}
                    mint={mint}
                    isActive={inputMint?.equals(mint)}
                    onPress={onMintSelect(mint)}
                    inactiveColor="black"
                    activeColor="secondary"
                  />
                ))}
              </Box>
            </Box>
          )}
        </Box>

        <Box
          flexDirection="row"
          marginHorizontal="m"
          justifyContent="space-between"
        >
          <ButtonPressable
            width="48%"
            borderRadius="round"
            backgroundColor="black400"
            backgroundColorOpacityPressed={0.05}
            titleColorPressedOpacity={0.3}
            titleColor="white"
            title={t('generic.cancel')}
            onPress={() => navigation.goBack()}
          />
          <ButtonPressable
            width="48%"
            borderRadius="round"
            backgroundColor="white"
            backgroundColorOpacityPressed={0.7}
            backgroundColorDisabled="secondaryBackground"
            titleColorDisabled="secondaryText"
            titleColor="black"
            titleColorPressedOpacity={0.3}
            title={t('generic.save')}
            onPress={handleSave}
          />
        </Box>
      </Box>
    </BackScreen>
  )
}

export default AutoGasManager
