import { upperCase } from 'lodash'
import React, { useCallback } from 'react'
import Text from '@components/Text'
import TouchableOpacityBox, {
  TouchableOpacityBoxProps,
} from '@components/TouchableOpacityBox'

type WordProps = {
  fullWord: string
  onPress: (fullWord: string) => void
}

type Props = Omit<TouchableOpacityBoxProps, 'children' | 'onPress'> & WordProps

const MatchingWord = ({ fullWord, onPress }: Props) => {
  const handlePress = useCallback(
    (selectedWord: string) => () => onPress(selectedWord),
    [onPress],
  )
  return (
    <TouchableOpacityBox
      justifyContent="center"
      alignContent="center"
      paddingHorizontal="4"
      paddingVertical="1.5"
      onPress={handlePress(fullWord)}
      backgroundColor="blue.dark-50"
      borderRadius="full"
    >
      <Text variant="textLgSemibold" color="blue.dark-500">
        {upperCase(fullWord)}
      </Text>
    </TouchableOpacityBox>
  )
}

export default MatchingWord
