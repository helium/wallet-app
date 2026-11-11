import { ResumeInfo } from './session'

// Copy keys for the parallel pending/partial outcome screens: pending's body
// ignores the failed count, and each has its own primary action label. A batch
// that threw (resume.failure, or a submit that may have landed) names the
// batch and resumes from it.
export const retryScreenKeys = (
  step: 'pending' | 'partial',
  resume: Pick<ResumeInfo, 'failure' | 'unconfirmedSubmit'>,
): { bodyKey: string; primaryKey: string } => {
  const pageFailed =
    step === 'partial' &&
    (resume.failure !== undefined || !!resume.unconfirmedSubmit)
  let bodyKey = `migrateToWorld.${step}.body`
  if (pageFailed)
    bodyKey = resume.unconfirmedSubmit
      ? 'migrateToWorld.partial.unconfirmedBody'
      : 'migrateToWorld.partial.pageFailedBody'
  let primaryKey = 'migrateToWorld.partial.retry'
  if (step === 'pending') primaryKey = 'migrateToWorld.pending.checkStatus'
  else if (pageFailed) primaryKey = 'migrateToWorld.partial.retryPage'
  return { bodyKey, primaryKey }
}
