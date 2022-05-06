import React, { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import Chevron from '@assets/images/voteChevron.svg'
import Box from '../../components/Box'
import Text from '../../components/Text'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import { useColors, useHitSlop } from '../../theme/themeHooks'
import voteAccentColors from './voteAccentColors'

type Props = {
  expanded: boolean
  alias: string
  hnt: string
  voteSelected: () => void
  toggleItem: () => void
  index: number
  value: string
}

const VoteOption = ({
  expanded,
  alias,
  hnt,
  voteSelected,
  toggleItem,
  index,
  value,
}: Props) => {
  const { t } = useTranslation()
  const { primaryText } = useColors()
  const hitSlop = useHitSlop('l')

  const chevronStyle = useMemo(() => {
    if (expanded) return {}
    return { transform: [{ rotate: '180deg' }] }
  }, [expanded])

  const backgroundColor = useMemo(() => voteAccentColors[index], [index])

  const canVote = useMemo(() => hnt !== '0', [hnt])

  return (
    <Box
      backgroundColor="secondary"
      paddingHorizontal="m"
      minHeight={60}
      borderRadius="xl"
      paddingVertical="m"
      marginVertical="lm"
    >
      <TouchableOpacityBox
        hitSlop={hitSlop}
        flexDirection="row"
        onPress={toggleItem}
        alignItems="center"
        flex={1}
      >
        <Box
          borderRadius="round"
          height={18}
          width={18}
          backgroundColor={backgroundColor}
          marginRight="s"
        />
        <Text variant="regular" fontSize={19} color="primaryText" flex={1}>
          {value}
        </Text>

        <Chevron color={primaryText} style={chevronStyle} />
      </TouchableOpacityBox>
      {expanded && (
        <Box>
          <Text
            variant="body1"
            fontSize={16}
            maxWidth="90%"
            marginTop="s"
            color={canVote ? 'primaryText' : 'error'}
          >
            {canVote ? t('vote.votingAs', { alias, hnt }) : t('vote.noHNT')}
          </Text>
          <TouchableOpacityBox
            onPress={voteSelected}
            disabled={!canVote}
            backgroundColor={canVote ? backgroundColor : 'surface'}
            marginVertical="lm"
            borderRadius="xl"
            paddingVertical="m"
          >
            <Text
              variant="subtitle1"
              textAlign="center"
              color={canVote ? 'primaryText' : 'secondaryText'}
            >
              {t('vote.vote')}
            </Text>
          </TouchableOpacityBox>
        </Box>
      )}
    </Box>
  )
}

export default memo(VoteOption)
