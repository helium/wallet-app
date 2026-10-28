import { formatBalanceDate } from '../formatBalanceDate'

describe('formatBalanceDate', () => {
  it('formats the UTC calendar day as day, full month and year', () => {
    expect(formatBalanceDate('2021-03-24T00:00:00.000Z', 'en-US')).toBe(
      'March 24, 2021',
    )
  })

  it('keeps the UTC day late in the UTC day, whatever the device time zone', () => {
    expect(formatBalanceDate('2021-03-24T23:30:00.000Z', 'en-US')).toBe(
      'March 24, 2021',
    )
  })

  it('orders the parts for the locale', () => {
    expect(formatBalanceDate('2021-03-04T00:00:00.000Z', 'de-DE')).toBe(
      '04. März 2021',
    )
  })

  it('returns an empty string for a date it cannot parse', () => {
    expect(formatBalanceDate('not a date', 'en-US')).toBe('')
  })
})
