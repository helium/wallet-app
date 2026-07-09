import {
  deriveResume,
  deserializeSession,
  MigrationSession,
  serializeSession,
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
  it('offers resume for a running session', () => {
    expect(deriveResume(base)).toEqual({
      canResume: true,
      input: base.originalInput,
    })
  })
  it('offers resume for a partial session', () => {
    expect(deriveResume({ ...base, status: 'partial' })).toEqual({
      canResume: true,
      input: base.originalInput,
    })
  })
  it('offers resume for a failed session', () => {
    expect(deriveResume({ ...base, status: 'failed' }).canResume).toBe(true)
  })
  it('does not offer resume for complete/idle/null', () => {
    expect(deriveResume({ ...base, status: 'complete' }).canResume).toBe(false)
    expect(deriveResume({ ...base, status: 'idle' }).canResume).toBe(false)
    expect(deriveResume(null)).toEqual({ canResume: false, input: null })
  })
})
