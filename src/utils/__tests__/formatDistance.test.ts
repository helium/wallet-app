import { formatDistance } from 'date-fns'
import shortLocale from '../formatDistance'

const base = new Date('2026-10-27T12:00:00Z')
const format = (date: Date) =>
  formatDistance(date, base, { locale: shortLocale, addSuffix: true })

describe('shortLocale', () => {
  it('formats a past time with an ago suffix', () => {
    expect(format(new Date('2026-10-27T11:55:00Z'))).toBe('5m ago')
  })

  it('formats a future time with an in prefix', () => {
    expect(format(new Date('2026-10-27T14:00:00Z'))).toBe('in 2h')
  })

  it('formats days', () => {
    expect(format(new Date('2026-10-24T12:00:00Z'))).toBe('3d ago')
  })
})
