import { selectWord } from '../wordSelection'

const phrase = (count: number) =>
  Array.from({ length: count }, (_, i) => `word${i + 1}`)

describe('selectWord', () => {
  it('submits when picking the last word completes a 12-word phrase', () => {
    const words = [...phrase(11), null]

    expect(selectWord({ words, wordIndex: 11, word: 'zoo' })).toEqual({
      words: [...phrase(11), 'zoo'],
      submit: true,
    })
  })

  it('does not submit while words are still missing', () => {
    const words = [...phrase(10), null, null]

    expect(selectWord({ words, wordIndex: 10, word: 'zoo' })).toEqual({
      words: [...phrase(10), 'zoo', null],
      submit: false,
    })
  })

  it('submits when picking the last word completes a 24-word phrase', () => {
    const words = [...phrase(23), null]

    expect(selectWord({ words, wordIndex: 23, word: 'zoo' }).submit).toBe(true)
  })

  it('does not submit on the 12th word of a 24-word phrase', () => {
    const words = [...phrase(11), null, ...new Array(12).fill(null)]

    expect(selectWord({ words, wordIndex: 11, word: 'zoo' }).submit).toBe(false)
  })

  it('submits when the last word is re-picked in a complete phrase', () => {
    expect(
      selectWord({ words: phrase(12), wordIndex: 11, word: 'word12' }),
    ).toEqual({ words: phrase(12), submit: true })
  })

  it('submits when filling a skipped earlier word completes the phrase', () => {
    const words = [...phrase(4), null, ...phrase(12).slice(5)]

    expect(selectWord({ words, wordIndex: 4, word: 'word5' })).toEqual({
      words: phrase(12),
      submit: true,
    })
  })

  it('does not submit when an earlier word is corrected in a complete phrase', () => {
    expect(
      selectWord({ words: phrase(12), wordIndex: 2, word: 'zoo' }),
    ).toEqual({
      words: ['word1', 'word2', 'zoo', ...phrase(12).slice(3)],
      submit: false,
    })
  })
})
