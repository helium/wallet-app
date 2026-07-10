import SafeAreaBox from '@components/SafeAreaBox'
import Text from '@components/Text'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import { useNavigation } from '@react-navigation/native'
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Linking } from 'react-native'
import { Edge } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { useEmbeddedSolanaWallet, usePrivy } from '@privy-io/expo'
import AssetSelectionStep, {
  AssetSelection,
} from './components/AssetSelectionStep'
import ConnectStep from './components/ConnectStep'
import EmailLoginStep from './components/EmailLoginStep'
import IntroStep from './components/IntroStep'
import NothingToMigrateStep from './components/NothingToMigrateStep'
import OutcomeStep from './components/OutcomeStep'
import PartialRetryStep from './components/PartialRetryStep'
import PendingStep from './components/PendingStep'
import ProgressStep from './components/ProgressStep'
import ReviewStep from './components/ReviewStep'
import SuccessStep from './components/SuccessStep'
import WalletCreateErrorStep from './components/WalletCreateErrorStep'
import { WORLD_URL } from './constants'
import { useMigrationAssets } from './hooks/useMigrationAssets'
import { useMigrationExecutor } from './hooks/useMigrationExecutor'
import { useMigrationSession } from './hooks/useMigrationSession'
import { uiToRaw } from './logic/amounts'
import { shortenMint } from './logic/assets'
import { shouldShowSupport } from './logic/retry'
import { MigrateInput, stepForOutcome } from './logic/session'
import { SelectableToken } from './logic/types'

export type FlowStep =
  | 'intro'
  | 'connect'
  | 'login'
  | 'select'
  | 'review'
  | 'migrating'
  | 'pending'
  | 'partial'
  | 'success'
  | 'walletError'

// The tokens the user chose to migrate (nonzero amount), each paired with its
// resolved SelectableToken when we can find it. Shared by the input builder and
// the review summary so both walk the selection identically.
const selectedTokens = (
  tokenAmounts: Record<string, string>,
  tokens: SelectableToken[],
): { mint: string; amount: string; token?: SelectableToken }[] =>
  Object.entries(tokenAmounts)
    .filter(([, amt]) => amt && amt !== '0')
    .map(([mint, amount]) => ({
      mint,
      amount,
      token: tokens.find((x) => x.mint === mint),
    }))

const MigrateToWorld = () => {
  const { t } = useTranslation()
  const navigation = useNavigation()
  const edges = useMemo(() => ['top', 'bottom'] as Edge[], [])
  const wallet = useCurrentWallet()
  const sourceWallet = wallet?.toBase58()

  const { user } = usePrivy()
  const solanaWallet = useEmbeddedSolanaWallet()
  const destinationWallet =
    solanaWallet.status === 'connected'
      ? solanaWallet.wallets?.[0]?.address
      : undefined

  const [step, setStep] = useState<FlowStep>('intro')
  const { persist, resume, clear } = useMigrationSession(sourceWallet)
  const assets = useMigrationAssets(sourceWallet)
  const { run, progress } = useMigrationExecutor(persist)

  const [selection, setSelection] = useState<AssetSelection>()
  const [error, setError] = useState<string>()
  // Tracked in state (not just a ref) so each failed attempt re-renders — the
  // support link needs to appear once attempts cross the threshold even while
  // the step is already 'walletError'.
  const [createAttempts, setCreateAttempts] = useState(0)
  const creating = useRef(false)

  // Ensure a destination embedded wallet exists once the user is logged in.
  // Creation can fail (network/Privy) and there is no destination without it,
  // so failures route to the 'walletError' step. A successful retry returns to
  // 'select' (an initial background create leaves the current step untouched).
  const createWallet = useCallback(async () => {
    if (!solanaWallet.create || creating.current) return
    creating.current = true
    try {
      await solanaWallet.create()
      setStep((s) => (s === 'walletError' ? 'select' : s))
    } catch {
      setCreateAttempts((n) => n + 1)
      setStep('walletError')
    } finally {
      creating.current = false
    }
  }, [solanaWallet])

  useEffect(() => {
    if (
      user &&
      solanaWallet.status === 'not-created' &&
      !creating.current &&
      step !== 'walletError'
    ) {
      createWallet()
    }
  }, [user, solanaWallet, step, createWallet])

  const hasRoutedRef = useRef(false)
  // An interrupted session (app closed mid-migration) resumes straight to the
  // screen its persisted status maps to — the same mapping the live run uses,
  // so a batch-level failure lands on retry, not the "still processing" screen.
  // persist() now updates `resume` live, so canResume also flips true DURING a
  // run; routing off that would yank the user off the 'migrating' screen. Guard
  // it to the initial load: only route from 'intro' (a live run has already
  // moved past it) and latch it so it fires exactly once.
  useEffect(() => {
    if (hasRoutedRef.current) return
    if (resume.canResume && step === 'intro') {
      hasRoutedRef.current = true
      setStep(stepForOutcome(resume.status))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resume.canResume])

  const buildInput = useCallback(
    (sel: AssetSelection): MigrateInput => ({
      sourceWallet: sourceWallet || '',
      destinationWallet: destinationWallet || '',
      hotspots: Array.from(sel.hotspotKeys),
      // Drop any mint we can't resolve decimals for — shipping an unconverted
      // UI decimal as a raw base-unit amount would corrupt the transfer on a
      // funds-moving path.
      tokens: selectedTokens(sel.tokenAmounts, assets.tokens).flatMap(
        ({ mint, amount, token }) =>
          token ? [{ mint, amount: uiToRaw(amount, token.decimals) }] : [],
      ),
    }),
    [sourceWallet, destinationWallet, assets.tokens],
  )

  const execute = useCallback(
    async (input: MigrateInput, returnStep: FlowStep) => {
      // Single destination-wallet guard. A resumed session can outlive its Privy
      // embedded wallet (expired session); without a destination, run() would
      // throw 'Destination wallet unavailable' and dead-end on an empty Review.
      // Recover the login/create path instead — createWallet leaves the current
      // step intact on success, so the user re-triggers once a wallet exists.
      if (!destinationWallet) {
        if (!user) setStep('login')
        else createWallet()
        return
      }
      setError(undefined)
      setStep('migrating')
      try {
        const result = await run(input)
        if (result.status === 'complete') {
          // Finished cleanly — drop the persisted session instead of leaving a
          // stale 'complete' record around.
          await clear()
        }
        // Non-complete outcomes leave `resume` updated by the executor's own
        // persist calls, so the pending/partial screens read counts from there.
        setStep(stepForOutcome(result.status))
      } catch (err) {
        setError((err as Error).message)
        // Return to the step the run was launched from: 'review' for a live
        // Confirm, or the retry screen for a resumed retry — never an empty
        // Review with a no-op Confirm.
        setStep(returnStep)
      }
    },
    [run, clear, destinationWallet, user, createWallet],
  )

  const onConfirm = useCallback(() => {
    if (selection) execute(buildInput(selection), 'review')
  }, [selection, buildInput, execute])

  const onRetry = useCallback(() => {
    // Snapshot the screen we're retrying from so a failure returns here instead
    // of the Confirm screen. The destination-missing recovery lives in execute.
    const returnStep = step
    const retryInput =
      resume.input ?? (selection ? buildInput(selection) : undefined)
    if (retryInput) execute(retryInput, returnStep)
  }, [step, resume.input, selection, buildInput, execute])

  const goToWorld = useCallback(() => Linking.openURL(WORLD_URL), [])
  const dismiss = useCallback(() => navigation.goBack(), [navigation])

  const tokenLines = useMemo(
    () =>
      selection
        ? selectedTokens(selection.tokenAmounts, assets.tokens).map(
            ({ mint, amount, token }) =>
              `${amount} ${token?.label ?? shortenMint(mint)}`,
          )
        : [],
    [selection, assets.tokens],
  )

  const isLoggedIn = !!user && !!destinationWallet

  const render = () => {
    switch (step) {
      case 'intro':
        return (
          <IntroStep
            onContinue={() => setStep(isLoggedIn ? 'select' : 'login')}
            onUseOwnWallet={() => setStep('connect')}
            onDismiss={dismiss}
          />
        )
      case 'connect':
        return <ConnectStep onBack={() => setStep('intro')} />
      case 'login':
        return (
          <EmailLoginStep
            onBack={() => setStep('intro')}
            onSuccess={() => setStep('select')}
          />
        )
      case 'select':
        // A failed asset load must not read as "nothing to migrate" — offer a
        // retry instead so a user with assets isn't wrongly told they're done.
        if (assets.error) {
          return (
            <OutcomeStep
              title={t('migrateToWorld.selectAssets.loadErrorTitle')}
              body={t('migrateToWorld.selectAssets.loadErrorBody')}
              primaryTitle={t('migrateToWorld.selectAssets.retry')}
              onPrimary={assets.reload}
              onDismiss={dismiss}
            />
          )
        }
        if (
          !assets.loading &&
          assets.hotspots.length === 0 &&
          assets.tokens.length === 0
        ) {
          return <NothingToMigrateStep onDone={dismiss} />
        }
        return (
          <AssetSelectionStep
            hotspots={assets.hotspots}
            tokens={assets.tokens}
            leftBehindCount={assets.leftBehindMints.length}
            loading={assets.loading}
            onBack={() => setStep('intro')}
            onReview={(sel) => {
              setSelection(sel)
              setStep('review')
            }}
          />
        )
      case 'review':
        return (
          <ReviewStep
            sourceWallet={sourceWallet || ''}
            destinationWallet={destinationWallet || ''}
            hotspotCount={selection?.hotspotKeys.size ?? 0}
            tokenLines={tokenLines}
            onBack={() => setStep('select')}
            onConfirm={onConfirm}
          />
        )
      case 'migrating':
        return (
          <ProgressStep
            walletReady={!!destinationWallet}
            label={
              progress
                ? t('migrateToWorld.migrating.batchLabel', {
                    phase: t(
                      `migrateToWorld.migrating.phases.${progress.phase}`,
                    ),
                    batch: progress.batch,
                  })
                : ''
            }
          />
        )
      case 'pending':
        return (
          <PendingStep
            movedCount={resume.movedCount}
            onCheckStatus={onRetry}
            onDismiss={dismiss}
          />
        )
      case 'partial':
        return (
          <PartialRetryStep
            movedCount={resume.movedCount}
            failedCount={resume.failedCount}
            onRetry={onRetry}
            onDismiss={dismiss}
          />
        )
      case 'success':
        return (
          <SuccessStep
            destinationWallet={destinationWallet || ''}
            onGoToWorld={goToWorld}
            onDone={dismiss}
          />
        )
      case 'walletError':
        // A logged-in user with no destination wallet is stuck until creation
        // succeeds — offer retry, and a support link after repeated failures.
        return (
          <WalletCreateErrorStep
            onRetry={createWallet}
            onDismiss={dismiss}
            showSupport={shouldShowSupport(createAttempts)}
          />
        )
      default:
        return null
    }
  }

  return (
    <SafeAreaBox edges={edges} flex={1} backgroundColor="primaryBackground">
      {error && (
        <SafeAreaBox edges={[]} paddingHorizontal="l" paddingTop="m">
          <Text variant="body3" color="error">
            {error}
          </Text>
        </SafeAreaBox>
      )}
      {render()}
    </SafeAreaBox>
  )
}

export default memo(MigrateToWorld)
