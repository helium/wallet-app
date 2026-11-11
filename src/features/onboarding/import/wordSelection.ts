import { validateMnemonic } from 'bip39'

const isComplete = (words: (string | null)[]) => words.every((w) => !!w)

/**
 * Places a picked suggestion into the phrase and decides whether the screen
 * should continue at once. It continues when this pick completes the phrase,
 * or when the last word is re-picked in a phrase that is already complete,
 * and only when the phrase also passes the BIP39 checksum.
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
    submit:
      isComplete(nextWords) &&
      (!isComplete(words) || isLastWord) &&
      validateMnemonic(nextWords.join(' ')),
  }
}

/** Return fills the first match; it may submit only when the typed text is that whole word. */
export const returnKeyPick = (typed: string, matchingWords: string[]) => ({
  word: matchingWords[0],
  canSubmit: typed.trim().toLowerCase() === matchingWords[0],
})
