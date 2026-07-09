import {
  deriveResume,
  deserializeSession,
  MigrationSession,
  serializeSession,
  stepForOutcome,
} from '../session'

const base: MigrationSession = {
  originalInput: {
    sourceWallet: 'src',
    destinationWallet: 'dst',
    hotspots: ['h1', 'h2'],
    tokens: [{ mint: 'm', amount: '100' }],
  },
  status: 'running',
  confirmedSignatures: ['sigA'],
  failedSignatures: [],
  updatedAt: 111,
}

describe('session serialization', () => {
  it('round-trips', () => {
    expect(deserializeSession(serializeSession(base))).toEqual(base)
  })
  it('returns null for empty/garbage input', () => {
    expect(deserializeSession(null)).toBeNull()
    expect(deserializeSession('not json')).toBeNull()
  })
  it('returns null when required fields are missing', () => {
    expect(deserializeSession(JSON.stringify({ status: 'running' }))).toBeNull()
  })
})

describe('deriveResume', () => {
  it('offers resume for a running session with confirmed/failed counts', () => {
    expect(deriveResume(base)).toEqual({
      canResume: true,
      input: base.originalInput,
      movedCount: 1,
      failedCount: 0,
      status: 'running',
    })
  })
  it('offers resume for a partial session', () => {
    expect(deriveResume({ ...base, status: 'partial' })).toEqual({
      canResume: true,
      input: base.originalInput,
      movedCount: 1,
      failedCount: 0,
      status: 'partial',
    })
  })
  it('offers resume for a failed session', () => {
    expect(deriveResume({ ...base, status: 'failed' }).canResume).toBe(true)
  })
  it('resumes from nextInput (last unconfirmed batch) when present', () => {
    const withNext: MigrationSession = {
      ...base,
      nextInput: { ...base.originalInput, hotspots: ['h3'] },
      batch: 2,
    }
    expect(deriveResume(withNext).input).toEqual(withNext.nextInput)
  })
  it('carries the session status through for the screen mapping', () => {
    expect(deriveResume({ ...base, status: 'failed' }).status).toBe('failed')
  })
  it('does not offer resume for complete/idle/null', () => {
    expect(deriveResume({ ...base, status: 'complete' }).canResume).toBe(false)
    expect(deriveResume({ ...base, status: 'idle' }).canResume).toBe(false)
    expect(deriveResume(null)).toEqual({
      canResume: false,
      input: null,
      movedCount: 0,
      failedCount: 0,
      status: 'idle',
    })
  })
})

describe('stepForOutcome', () => {
  it('maps a clean finish to the success screen', () => {
    expect(stepForOutcome('complete')).toBe('success')
  })
  it('maps still-processing states to the pending screen', () => {
    expect(stepForOutcome('running')).toBe('pending')
    expect(stepForOutcome('pending')).toBe('pending')
  })
  it('maps partial and failed to the retry screen', () => {
    expect(stepForOutcome('partial')).toBe('partial')
    // A batch-level failure (zero failed signatures) must still land on retry,
    // not the reassuring "still processing" screen.
    expect(stepForOutcome('failed')).toBe('partial')
  })
})
