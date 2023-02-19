import Balance, { CurrencyType } from '@helium/currency'
import { BoxProps } from '@shopify/restyle'
import React, { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import Box from '@components/Box'
import Text from '@components/Text'
import { Color, Theme } from '@theme/theme'
import { balanceToString } from '@utils/Balance'
import { locale } from '@utils/i18n'

type Props = {
  uniqueWallets?: number | null
  totalVotes: number
  hntVoted?: number | null
  value: string
  address: string
  color: Color
} & BoxProps<Theme>
const VoteShowResult = ({
  uniqueWallets,
  totalVotes,
  hntVoted,
  value,
  color,
  address: _address,
  ...boxProps
}: Props) => {
  const { t } = useTranslation()
  const percentOfVote = useMemo(() => {
    if (!hntVoted || !totalVotes) return 0
    return hntVoted / totalVotes
  }, [hntVoted, totalVotes])

  const totalHntStr = useMemo(() => {
    if (!hntVoted) return ' '

    const bal = new Balance(hntVoted, CurrencyType.networkToken)
    return balanceToString(bal, { maxDecimalPlaces: 2 })
  }, [hntVoted])

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <Box {...boxProps}>
      <Box
        flexDirection="row"
        height={8}
        marginTop="m"
        marginBottom="s"
        borderRadius="round"
        overflow="hidden"
      >
        <Box flex={percentOfVote} backgroundColor={color} />
        <Box flex={1 - percentOfVote} backgroundColor="secondary" />
      </Box>
      <Text variant="body1">
        {`${value} (${(percentOfVote * 100).toLocaleString(locale, {
          maximumFractionDigits: 2,
        })}%)`}
      </Text>
      <Box flexDirection="row" justifyContent="space-between">
        <Text variant="body2" color="secondaryText">
          {totalHntStr}
        </Text>
        {!!uniqueWallets && (
          <Text variant="body2" color="secondaryText">
            {t('vote.voteCount', {
              totalVotes: uniqueWallets.toLocaleString(locale),
            })}
          </Text>
        )}
      </Box>
    </Box>
  )
}
export default memo(VoteShowResult)
