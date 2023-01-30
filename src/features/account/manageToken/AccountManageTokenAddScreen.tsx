import { useNavigation } from '@react-navigation/native'
import React, { useCallback, useMemo, useState } from 'react'
import BackArrow from '@assets/images/backArrow.svg'
import { Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import Balance, { CurrencyType } from '@helium/currency'
import InfoIcon from '@assets/images/info.svg'
import { PublicKey } from '@solana/web3.js'
import { getKeypair } from '../../../storage/secureStorage'
import { balanceToString } from '../../../utils/Balance'
import ButtonPressable from '../../../components/ButtonPressable'
import Box from '../../../components/Box'
import Text from '../../../components/Text'
import TextInput from '../../../components/TextInput'
import { HomeNavigationProp } from '../../home/homeTypes'
import IconPressedContainer from '../../../components/IconPressedContainer'
import { useColors, useHitSlop } from '../../../theme/themeHooks'
import FabButton from '../../../components/FabButton'
import { useAppStorage } from '../../../storage/AppStorageProvider'
import { useAccountStorage } from '../../../storage/AccountStorageProvider'
import { useAppDispatch } from '../../../store/store'
import { addNewSplToken } from '../../../store/slices/solanaSlice'

const AccountManageTokenAddScreen: React.FC = () => {
  const navigation = useNavigation<HomeNavigationProp>()
  const { primaryText } = useColors()
  const { top } = useSafeAreaInsets()
  const hitSlop = useHitSlop('l')
  const { t } = useTranslation()
  const [form, setForm] = useState({
    mintAddress: '',
    name: '',
    symbol: '',
  })
  const { solanaNetwork: cluster } = useAppStorage()
  const { currentAccount } = useAccountStorage()
  const dispatch = useAppDispatch()

  const isValidForm = useMemo(() => {
    let isValid = true

    if (
      form.name.length === 0 ||
      form.symbol.length === 0 ||
      form.mintAddress.length === 0
    ) {
      isValid = false
    }

    return isValid
  }, [form.mintAddress.length, form.name.length, form.symbol.length])

  const addToken = useCallback(async () => {
    if (!currentAccount || !isValidForm) return

    const secureAcct = await getKeypair(currentAccount.address)

    if (!secureAcct || !currentAccount?.solanaAddress) return

    try {
      const signer = {
        publicKey: new PublicKey(currentAccount?.solanaAddress),
        secretKey: secureAcct.privateKey,
      }

      dispatch(
        addNewSplToken({
          account: currentAccount,
          signer,
          cluster,
          mintAddress: form.mintAddress,
          name: form.name,
          symbol: form.symbol,
        }),
      )
    } catch (error) {
      console.error(error)
    }
  }, [
    cluster,
    currentAccount,
    dispatch,
    form.mintAddress,
    form.name,
    form.symbol,
    isValidForm,
  ])

  // TODO: get network fee from getFee useTxn hook
  const networkFee = useMemo(
    () => new Balance(NETWORK_FEE, CurrencyType.solTokens),
    [],
  )

  const containerStyle = useMemo(
    () => ({ marginTop: Platform.OS === 'android' ? top : undefined }),
    [top],
  )

  return (
    <Box
      style={containerStyle}
      flex={1}
      borderTopStartRadius="xl"
      borderTopEndRadius="xl"
      backgroundColor="surfaceSecondary"
    >
      <Box
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
        borderTopStartRadius="xl"
        borderTopEndRadius="xl"
        marginBottom="m"
      >
        <Box flex={1} hitSlop={hitSlop} padding="s">
          <IconPressedContainer
            onPress={navigation.goBack}
            activeOpacity={0.75}
            idleOpacity={1.0}
          >
            <BackArrow color={primaryText} height={16} width={16} />
          </IconPressedContainer>
        </Box>

        <Text
          variant="subtitle2"
          textAlign="center"
          color="primaryText"
          maxFontSizeMultiplier={1}
        >
          {t('accountTokenList.addToken.title')}
        </Text>

        <Box flex={1} />
      </Box>

      <Box justifyContent="space-between" flex={1} paddingHorizontal="m">
        <Box alignItems="center">
          <FabButton
            icon="add"
            backgroundColor="gold"
            backgroundColorOpacity={0.1}
            iconColor="orange500"
            size={84}
            iconSize={38}
            disabled
            marginBottom="xl"
          />

          {INPUTS.map((item) => (
            <TextInput
              key={item.value}
              backgroundColor="secondaryBackground"
              marginBottom="m"
              height={56}
              paddingHorizontal="m"
              borderRadius="m"
              fontSize={18}
              textInputProps={{
                placeholder: t(item.placeholder),
                onChangeText: (value) =>
                  setForm({ ...form, [item.value]: value }),
                value: form[item.value],
                autoComplete: 'off',
                returnKeyType: 'done',
                autoCorrect: false,
              }}
            />
          ))}
        </Box>

        <Box>
          <Box
            flexDirection="row"
            alignItems="center"
            borderColor="black400"
            marginBottom="m"
            borderWidth={1}
            borderRadius="m"
            padding="ms"
            backgroundColor="surfaceSecondary"
          >
            <InfoIcon width={18} />
            <Text marginLeft="sx" color="white" fontWeight="600">
              {t('accountTokenList.addToken.fee', {
                value: balanceToString(networkFee, {
                  maxDecimalPlaces: 5,
                }),
              })}
            </Text>
          </Box>
          <Box flexDirection="row" marginBottom="xl">
            <Box width="50%" paddingRight="s">
              <ButtonPressable
                borderRadius="round"
                backgroundColor="black300"
                backgroundColorDisabled="white"
                backgroundColorDisabledOpacity={0.1}
                onPress={navigation.goBack}
                title={t('generic.cancel')}
                titleColor="grey600"
              />
            </Box>

            <Box width="50%" paddingLeft="s">
              <ButtonPressable
                borderRadius="round"
                backgroundColor="surfaceContrast"
                backgroundColorOpacityPressed={0.7}
                backgroundColorDisabledOpacity={0.6}
                // disabled={!isValidForm}
                backgroundColorDisabled="surfaceContrast"
                titleColorDisabled="secondaryText"
                title={t('generic.save')}
                titleColor="surfaceContrastText"
                onPress={addToken}
              />
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default AccountManageTokenAddScreen

//
// Utils
//

const INPUTS: {
  placeholder: string
  value: 'mintAddress' | 'name' | 'symbol'
}[] = [
  {
    placeholder: 'accountTokenList.addToken.placeholder.mint',
    value: 'mintAddress',
  },
  {
    placeholder: 'accountTokenList.addToken.placeholder.name',
    value: 'name',
  },
  {
    placeholder: 'accountTokenList.addToken.placeholder.symbol',
    value: 'symbol',
  },
]

const NETWORK_FEE = 204000
