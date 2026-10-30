import { batchSubmitError } from '../batchSubmitError'
import { submitStage } from '../submitStage'

// PaymentScreen and BurnScreen both pass the batch status through
// batchSubmitError and into submitStage, as PaymentSubmit does.
const stageFor = (status: Parameters<typeof batchSubmitError>[0]) =>
  submitStage({
    succeeded: status === 'confirmed',
    hasError: !!batchSubmitError(status),
  })

describe('batchSubmitError', () => {
  it('ends a partial batch in the error stage with a message', () => {
    expect(stageFor('partial')).toBe('error')
    expect(batchSubmitError('partial')?.message).toBe(
      'Some transactions failed. Retry sends only those.',
    )
  })

  it('ends an expired batch in the error stage with a message', () => {
    expect(stageFor('expired')).toBe('error')
    expect(batchSubmitError('expired')?.message).toBe('Transaction expired')
  })

  it('ends a failed batch in the error stage with a message', () => {
    expect(stageFor('failed')).toBe('error')
    expect(batchSubmitError('failed')?.message).toBe('Transaction failed')
  })

  it('ends a confirmed batch in the success stage', () => {
    expect(batchSubmitError('confirmed')).toBeUndefined()
    expect(stageFor('confirmed')).toBe('success')
  })

  it('stays loading while the batch is pending or not yet fetched', () => {
    expect(batchSubmitError('pending')).toBeUndefined()
    expect(stageFor('pending')).toBe('loading')
    expect(batchSubmitError(undefined)).toBeUndefined()
    expect(stageFor(undefined)).toBe('loading')
  })
})
