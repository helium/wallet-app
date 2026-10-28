import i18n from '../i18n'

jest.mock('react-native-localize', () => require('react-native-localize/mock'))
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
)

describe('i18n', () => {
  it('translates a plain key', () => {
    expect(i18n.t('generic.cancel')).toBe('Cancel')
  })

  it('interpolates values', () => {
    expect(i18n.t('ledger.show.accountsAlreadyLinked', { count: 3 })).toBe(
      'Wallets Already Linked (3)',
    )
  })

  it('returns an array for an array key', () => {
    expect(
      i18n.t('ledger.connectError.steps', { returnObjects: true }),
    ).toEqual([
      'Check network connection',
      'Check Bluetooth is enabled',
      'Open your Ledger device.',
    ])
  })

  it.each([
    [0, '0 Recipients'],
    [1, '1 Recipient'],
    [2, '2 Recipients'],
  ])('pluralizes %i recipients', (count, expected) => {
    expect(i18n.t('payment.totalRecipients', { count })).toBe(expected)
  })

  it.each([
    [1, '1 Hotspot'],
    [5, '5 Hotspots'],
  ])('pluralizes %i hotspots', (count, expected) => {
    expect(i18n.t('collectablesScreen.hotspots.hotspotCount', { count })).toBe(
      expected,
    )
  })

  it.each([
    [1, "1 token can't move automatically. It stays in your wallet."],
    [3, "3 tokens can't move automatically. They stay in your wallet."],
  ])('pluralizes %i tokens left behind', (count, expected) => {
    expect(i18n.t('migrateToWorld.selectAssets.leftBehind', { count })).toBe(
      expected,
    )
  })
})
