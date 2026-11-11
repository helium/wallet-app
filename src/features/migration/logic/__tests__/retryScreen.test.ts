import { retryScreenKeys } from '../retryScreen'

describe('retryScreenKeys', () => {
  it('a partial step with a page failure names the failed batch', () => {
    expect(retryScreenKeys('partial', { failure: 'boom' })).toEqual({
      bodyKey: 'migrateToWorld.partial.pageFailedBody',
      primaryKey: 'migrateToWorld.partial.retryPage',
    })
  })

  it('a partial step with an unconfirmed submit and an empty failure shows the unconfirmed copy', () => {
    expect(
      retryScreenKeys('partial', { failure: '', unconfirmedSubmit: true }),
    ).toEqual({
      bodyKey: 'migrateToWorld.partial.unconfirmedBody',
      primaryKey: 'migrateToWorld.partial.retryPage',
    })
  })

  it('a partial step with an unconfirmed submit and no failure shows the unconfirmed copy', () => {
    expect(retryScreenKeys('partial', { unconfirmedSubmit: true })).toEqual({
      bodyKey: 'migrateToWorld.partial.unconfirmedBody',
      primaryKey: 'migrateToWorld.partial.retryPage',
    })
  })

  it('a partial step with no failure shows the failed-items copy', () => {
    expect(retryScreenKeys('partial', {})).toEqual({
      bodyKey: 'migrateToWorld.partial.body',
      primaryKey: 'migrateToWorld.partial.retry',
    })
  })

  it('a pending step offers a status check', () => {
    expect(retryScreenKeys('pending', {})).toEqual({
      bodyKey: 'migrateToWorld.pending.body',
      primaryKey: 'migrateToWorld.pending.checkStatus',
    })
  })
})
