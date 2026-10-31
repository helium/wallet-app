import { PressableScale } from '@ui/PressableScale'
import { Text } from '@ui/Text'
import { upperCase } from 'lodash'
import React from 'react'

type Props = {
  fullWord: string
  matchingText: string
  onPress: (fullWord: string) => void
}

const MatchingWord = ({ fullWord, matchingText, onPress }: Props) => (
  <PressableScale
    testID={`MatchingWord.${fullWord}`}
    feedback="opacity"
    className="ml-3 justify-center px-3 py-4"
    onPress={() => onPress(fullWord)}
  >
    <Text size="base" className="text-navy-foreground">
      {upperCase(matchingText)}
      <Text size="base" className="text-navy-foreground/50">
        {upperCase(fullWord.slice(matchingText.length))}
      </Text>
    </Text>
  </PressableScale>
)

export default MatchingWord
