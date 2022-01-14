import { upperCase } from 'lodash'
import React, { useCallback } from 'react'
import TouchableOpacityBox, {
  TouchableOpacityBoxProps,
} from '../../components/TouchableOpacityBox'
import Text from '../../components/Text'

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
      marginRight="s"
      marginLeft={{ smallPhone: 'm', phone: 'ms' }}
      paddingHorizontal={{ smallPhone: 'm', phone: 'ms' }}
      paddingVertical="m"
      onPress={handlePress(fullWord)}
    >
      <Text
        variant="body1"
        justifyContent="center"
        alignContent="center"
        color="purple500"
      >
        {upperCase(matchingText)}
        <Text
          variant="body1"
          alignContent="center"
          justifyContent="center"
          color="grey700"
        >
          {upperCase(fullWord.slice(matchingText.length))}
        </Text>
      </Text>
    </TouchableOpacityBox>
  )
}

export default MatchingWord
