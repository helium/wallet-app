const isComplete = (words: (string | null)[]) => words.every((w) => !!w)

/**
 * Places a picked suggestion into the phrase and decides whether the screen
 * should continue at once. It continues when this pick completes the phrase,
 * or when the last word is re-picked in a phrase that is already complete.
 */
export const selectWord = ({
  words,
  wordIndex,
  word,
}: {
  words: (string | null)[]
  wordIndex: number
  word: string
}) => {
  const nextWords = [
    ...words.slice(0, wordIndex),
    word,
    ...words.slice(wordIndex + 1),
  ]
  const isLastWord = wordIndex === words.length - 1

  return {
    words: nextWords,
    submit: isComplete(nextWords) && (!isComplete(words) || isLastWord),
  }
}
