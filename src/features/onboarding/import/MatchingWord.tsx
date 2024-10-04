import { upperCase } from 'lodash'
import React, { useCallback } from 'react'
import Text from '@components/Text'
import TouchableOpacityBox, {
  TouchableOpacityBoxProps,
} from '@components/TouchableOpacityBox'

type WordProps = {
  fullWord: string
  matchingText: string
  onPress: (fullWord: string) => void
}

type Props = Omit<TouchableOpacityBoxProps, 'children' | 'onPress'> & WordProps

const MatchingWord = ({ fullWord, matchingText, onPress }: Props) => {
  const handlePress = useCallback(
    (selectedWord: string) => () => onPress(selectedWord),
    [onPress],
  )
  return (
    <TouchableOpacityBox
      justifyContent="center"
      alignContent="center"
      marginLeft={{ none: '4', sm: '3' }}
      paddingHorizontal={{ none: '4', sm: '3' }}
      paddingVertical="4"
      onPress={handlePress(fullWord)}
    >
      <Text
        variant="textMdRegular"
        justifyContent="center"
        alignContent="center"
        color="primaryText"
      >
        {upperCase(matchingText)}
        <Text
          variant="textMdRegular"
          alignContent="center"
          justifyContent="center"
          color="secondaryText"
        >
          {upperCase(fullWord.slice(matchingText.length))}
        </Text>
      </Text>
    </TouchableOpacityBox>
  )
}

export default MatchingWord
