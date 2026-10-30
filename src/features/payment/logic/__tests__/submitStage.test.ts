import { submitStage } from '../submitStage'

describe('submitStage', () => {
  it('shows the loading view while the send is in flight', () => {
    expect(submitStage({ succeeded: false, hasError: false })).toBe('loading')
  })

  it('shows the result as soon as the send succeeds', () => {
    expect(submitStage({ succeeded: true, hasError: false })).toBe('success')
  })

  it('shows the error as soon as the send fails', () => {
    expect(submitStage({ succeeded: false, hasError: true })).toBe('error')
  })

  it('shows the result when the send succeeded even if an error arrived', () => {
    expect(submitStage({ succeeded: true, hasError: true })).toBe('success')
  })
})
