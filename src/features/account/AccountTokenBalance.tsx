import Box from '@components/Box'
import Text from '@components/Text'
import TextTransform from '@components/TextTransform'
import { useOwnedAmount, useTokenAccount } from '@helium/helium-react-hooks'
import { DC_MINT } from '@helium/spl-utils'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import { BoxProps } from '@shopify/restyle'
import { PublicKey } from '@solana/web3.js'
import { useAccountStorage } from '@storage/AccountStorageProvider'
import { Theme } from '@theme/theme'
import { IOT_SUB_DAO_KEY, MOBILE_SUB_DAO_KEY } from '@utils/constants'
import { getEscrowTokenAccount, humanReadable } from '@utils/solanaUtils'
import BN from 'bn.js'
import React, { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

type Props = {
  mint: PublicKey
  textVariant?: 'h0' | 'h1' | 'h2' | 'h2Medium'
  showTicker?: boolean
} & BoxProps<Theme>

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
    <Box>
      <Text variant="body1" color="secondaryText" textAlign="center">
        {t('accountsScreen.receivedBalance', {
          amount: humanReadable(
            new BN(iotEscrowAcct?.amount?.toString() || '0').add(
              new BN(mobileEscrowAcct?.amount?.toString() || '0'),
            ),
            6,
          ),
        })}
      </Text>
    </Box>
  )
}

const AccountTokenBalance = ({
  mint,
  textVariant,
  showTicker = true,
  ...boxProps
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

  const tokenDetails = useMemo(() => {
    if (!mint.equals(DC_MINT) || !showTicker) return

    return <EscrowDetails />
  }, [mint, showTicker])

  return (
    <Box flexDirection="row" justifyContent="center" {...boxProps}>
      {!showTicker &&
        (loadingOwned ? (
          <Box width={70} height={20} marginTop="s" backgroundColor="surface" />
        ) : (
          <Text
            variant={textVariant || 'h1'}
            color="primaryText"
            numberOfLines={1}
            maxFontSizeMultiplier={1}
            adjustsFontSizeToFit
          >
            {balanceStr}
          </Text>
        ))}
      <Box>
        {showTicker && (
          <TextTransform
            variant={textVariant || 'h1'}
            color="primaryText"
            numberOfLines={1}
            maxFontSizeMultiplier={1}
            adjustsFontSizeToFit
            i18nKey="accountsScreen.tokenBalance"
            values={{
              amount: balanceStr,
              ticker: symbol,
            }}
          />
        )}
        {tokenDetails}
      </Box>
    </Box>
  )
}

export default memo(AccountTokenBalance)
