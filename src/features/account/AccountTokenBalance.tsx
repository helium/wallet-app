import { useOwnedAmount, useTokenAccount } from '@helium/helium-react-hooks'
import { DC_MINT } from '@helium/spl-utils'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import { PublicKey } from '@solana/web3.js'
import { useAccountStorage } from '@storage/AccountStorageProvider'
import { Text } from '@ui/Text'
import { twMerge } from '@ui/twMerge'
import { IOT_SUB_DAO_KEY, MOBILE_SUB_DAO_KEY } from '@utils/constants'
import { getEscrowTokenAccount, humanReadable } from '@utils/solanaUtils'
import BN from 'bn.js'
import React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { View } from 'react-native'

const TEXT_VARIANT_CLASS = {
  h0: 'text-4xl',
  h1: 'text-4xl',
  h2: 'text-3xl',
  h2Medium: 'text-3xl font-medium',
} as const

type Props = {
  mint: PublicKey
  textVariant?: keyof typeof TEXT_VARIANT_CLASS
  showTicker?: boolean
  testID?: string
  className?: string
}

const EscrowDetails = () => {
  const { t } = useTranslation()
  const { currentAccount } = useAccountStorage()

  const iotEscrow = getEscrowTokenAccount(
    currentAccount?.solanaAddress,
    IOT_SUB_DAO_KEY,
  )
  const mobileEscrow = getEscrowTokenAccount(
    currentAccount?.solanaAddress,
    MOBILE_SUB_DAO_KEY,
  )
  const { info: iotEscrowAcct } = useTokenAccount(iotEscrow)
  const { info: mobileEscrowAcct } = useTokenAccount(mobileEscrow)

  return (
    <View>
      <Text size="base" className="text-center text-muted-foreground">
        {t('accountsScreen.receivedBalance', {
          amount: humanReadable(
            new BN(iotEscrowAcct?.amount?.toString() || '0').add(
              new BN(mobileEscrowAcct?.amount?.toString() || '0'),
            ),
            6,
          ),
        })}
      </Text>
    </View>
  )
}

const AccountTokenBalance = ({
  mint,
  textVariant = 'h1',
  showTicker = true,
  testID,
  className,
}: Props) => {
  const wallet = useCurrentWallet()
  const {
    amount: balance,
    decimals,
    loading: loadingOwned,
  } = useOwnedAmount(wallet, mint)
  const balanceStr =
    typeof decimals !== 'undefined' && balance
      ? humanReadable(new BN(balance?.toString() || '0'), decimals)
      : undefined
  const { symbol } = useMetaplexMetadata(mint)
  const textClass = TEXT_VARIANT_CLASS[textVariant]

  return (
    <View
      testID={testID}
      className={twMerge('flex-row justify-center', className)}
    >
      {!showTicker &&
        (loadingOwned ? (
          <View className="mt-2 h-5 w-[70px] bg-card" />
        ) : (
          <Text
            className={textClass}
            numberOfLines={1}
            maxFontSizeMultiplier={1}
            adjustsFontSizeToFit
          >
            {balanceStr}
          </Text>
        ))}
      <View>
        {showTicker && (
          <Text
            className={textClass}
            numberOfLines={1}
            maxFontSizeMultiplier={1}
            adjustsFontSizeToFit
          >
            <Trans
              i18nKey="accountsScreen.tokenBalance"
              values={{ amount: balanceStr, ticker: symbol }}
              components={{
                secondaryText: (
                  <Text
                    className={twMerge(textClass, 'text-muted-foreground')}
                  />
                ),
              }}
            />
          </Text>
        )}
        {mint.equals(DC_MINT) && showTicker && <EscrowDetails />}
      </View>
    </View>
  )
}

export default AccountTokenBalance
