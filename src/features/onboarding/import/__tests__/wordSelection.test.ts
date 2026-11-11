import { validateMnemonic } from 'bip39'
import { returnKeyPick, selectWord } from '../wordSelection'

const phrase = (count: number) =>
  Array.from({ length: count }, (_, i) => `word${i + 1}`)

// Valid BIP39 phrases: 'abandon' x11 + 'about', and 'abandon' x23 + 'art'.
const valid12 = [...new Array(11).fill('abandon'), 'about']
const valid24 = [...new Array(23).fill('abandon'), 'art']

describe('selectWord', () => {
  it('uses valid BIP39 fixtures', () => {
    expect(validateMnemonic(valid12.join(' '))).toBe(true)
    expect(validateMnemonic(valid24.join(' '))).toBe(true)
    expect(validateMnemonic(valid24.slice(0, 12).join(' '))).toBe(false)
  })

  it('submits when picking the last word completes a 12-word phrase', () => {
    const words = [...valid12.slice(0, 11), null]

    expect(selectWord({ words, wordIndex: 11, word: 'about' })).toEqual({
      words: valid12,
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
    const words = [...valid24.slice(0, 23), null]

    expect(selectWord({ words, wordIndex: 23, word: 'art' }).submit).toBe(true)
  })

  it('does not submit on the 12th word of a 24-word phrase', () => {
    const words = [...phrase(11), null, ...new Array(12).fill(null)]

    expect(selectWord({ words, wordIndex: 11, word: 'zoo' }).submit).toBe(false)
  })

  it('does not submit a filled phrase that fails the checksum', () => {
    const words = [...new Array(11).fill('abandon'), null]

    expect(selectWord({ words, wordIndex: 11, word: 'abandon' })).toEqual({
      words: new Array(12).fill('abandon'),
      submit: false,
    })
  })

  it('does not submit the first 12 words of a 24-word phrase in 12-word mode', () => {
    const words = [...valid24.slice(0, 11), null]

    expect(selectWord({ words, wordIndex: 11, word: valid24[11] }).submit).toBe(
      false,
    )
  })

  it('submits when the last word is re-picked in a complete phrase', () => {
    expect(
      selectWord({ words: valid12, wordIndex: 11, word: 'about' }),
    ).toEqual({ words: valid12, submit: true })
  })

  it('submits when filling a skipped earlier word completes the phrase', () => {
    const words = [...valid12.slice(0, 4), null, ...valid12.slice(5)]

    expect(selectWord({ words, wordIndex: 4, word: 'abandon' })).toEqual({
      words: valid12,
      submit: true,
    })
  })

  it('does not submit when an earlier word is corrected in a complete phrase', () => {
    // 'achieve' at index 2 still passes the checksum, so only the
    // earlier-word rule stops the submit.
    expect(
      selectWord({ words: valid12, wordIndex: 2, word: 'achieve' }),
    ).toEqual({
      words: ['abandon', 'abandon', 'achieve', ...valid12.slice(3)],
      submit: false,
    })
  })
})

describe('returnKeyPick', () => {
  it('fills the first match without submitting for a prefix', () => {
    expect(returnKeyPick('CA', ['cabbage', 'cabin'])).toEqual({
      word: 'cabbage',
      canSubmit: false,
    })
  })

  it('submits when the typed text is the whole first match', () => {
    expect(returnKeyPick('CABBAGE ', ['cabbage', 'cabin']).canSubmit).toBe(true)
  })

  it('does not submit for a longer prefix', () => {
    expect(returnKeyPick('cab', ['cabbage', 'cabin']).canSubmit).toBe(false)
  })
})
