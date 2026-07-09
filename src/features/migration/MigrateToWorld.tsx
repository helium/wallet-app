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
import { useEmbeddedSolanaWallet, usePrivy } from '@privy-io/expo'
import AssetSelectionStep, {
  AssetSelection,
} from './components/AssetSelectionStep'
import ConnectStep from './components/ConnectStep'
import EmailLoginStep from './components/EmailLoginStep'
import IntroStep from './components/IntroStep'
import NothingToMigrateStep from './components/NothingToMigrateStep'
import PartialRetryStep from './components/PartialRetryStep'
import PendingStep from './components/PendingStep'
import ProgressStep from './components/ProgressStep'
import ReviewStep from './components/ReviewStep'
import SuccessStep from './components/SuccessStep'
import WalletCreateErrorStep from './components/WalletCreateErrorStep'
import { useMigrationAssets } from './hooks/useMigrationAssets'
import { useMigrationExecutor } from './hooks/useMigrationExecutor'
import { useMigrationSession } from './hooks/useMigrationSession'
import { uiToRaw } from './logic/amounts'
import { shouldShowSupport } from './logic/retry'
import { MigrateInput } from './logic/session'
import { SelectableToken } from './logic/types'

const WORLD_URL = 'https://world.helium.com'

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
  // The resume point reported by the last run when it ended partial/pending in
  // this session (no app restart, so `resume` hasn't been reloaded). Retry
  // prefers it so it never re-sends already-confirmed batches.
  const [lastRunNextInput, setLastRunNextInput] = useState<MigrateInput>()
  const [outcome, setOutcome] = useState<{ moved: number; failed: number }>()
  const [error, setError] = useState<string>()
  const [progressLabel, setProgressLabel] = useState('')
  const [createError, setCreateError] = useState(false)
  const createAttempts = useRef(0)
  const creating = useRef(false)

  // Ensure a destination embedded wallet exists once the user is logged in.
  // Creation can fail (network/Privy) and there is no destination without it,
  // so failures surface a retry/support state rather than being swallowed.
  const createWallet = useCallback(async () => {
    if (!solanaWallet.create || creating.current) return
    creating.current = true
    setCreateError(false)
    try {
      await solanaWallet.create()
    } catch {
      createAttempts.current += 1
      setCreateError(true)
    } finally {
      creating.current = false
    }
  }, [solanaWallet])

  useEffect(() => {
    if (
      user &&
      solanaWallet.status === 'not-created' &&
      !creating.current &&
      !createError
    ) {
      createWallet()
    }
  }, [user, solanaWallet, createError, createWallet])

  // An interrupted session (app closed mid-migration) resumes straight to the
  // partial screen, where retry re-runs the persisted input.
  useEffect(() => {
    if (resume.canResume) {
      setOutcome({ moved: resume.movedCount, failed: resume.failedCount })
      // A resumable session with nothing failed was interrupted mid-confirm
      // (or timed out still pending) — show the honest "still processing"
      // screen, not the retry-failed framing. Only real failures go to partial.
      setStep(resume.failedCount > 0 ? 'partial' : 'pending')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resume.canResume])

  // Track the label locally rather than reading `progress` directly: the
  // executor hook doesn't reset `progress` at the start of run(), so on a
  // retry it would otherwise briefly show the prior attempt's stale phase.
  useEffect(() => {
    if (progress)
      setProgressLabel(`${progress.phase} · batch ${progress.batch}`)
  }, [progress])

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
    async (input: MigrateInput) => {
      setError(undefined)
      setProgressLabel('')
      setStep('migrating')
      try {
        const result = await run(input)
        if (result.status === 'complete') {
          // Finished cleanly — drop the persisted session instead of leaving a
          // stale 'complete' record around.
          setLastRunNextInput(undefined)
          await clear()
          setStep('success')
        } else if (result.status === 'pending') {
          // Nothing failed — txs are still confirming. Show honest
          // "still processing" messaging, not a failure/retry screen.
          setLastRunNextInput(result.nextInput)
          setOutcome({ moved: result.confirmedSignatures.length, failed: 0 })
          setStep('pending')
        } else {
          setLastRunNextInput(result.nextInput)
          setOutcome({
            moved: result.confirmedSignatures.length,
            failed: result.failedSignatures.length,
          })
          setStep('partial')
        }
      } catch (err) {
        setError((err as Error).message)
        setStep('review')
      }
    },
    [run, setStep, clear],
  )

  const onConfirm = useCallback(() => {
    if (selection) execute(buildInput(selection))
  }, [selection, buildInput, execute])

  const onRetry = useCallback(() => {
    const retryInput =
      lastRunNextInput ??
      resume.input ??
      (selection ? buildInput(selection) : undefined)
    if (retryInput) execute(retryInput)
  }, [lastRunNextInput, resume.input, selection, buildInput, execute])

  const goToWorld = useCallback(() => Linking.openURL(WORLD_URL), [])
  const dismiss = useCallback(() => navigation.goBack(), [navigation])

  const tokenLines = useMemo(
    () =>
      selection
        ? selectedTokens(selection.tokenAmounts, assets.tokens).map(
            ({ mint, amount, token }) =>
              `${amount} ${token?.label ?? mint.slice(0, 4)}`,
          )
        : [],
    [selection, assets.tokens],
  )

  const isLoggedIn = !!user && !!destinationWallet

  const render = () => {
    // A logged-in user with no destination wallet is stuck until creation
    // succeeds — surface the retry/support state over any post-login step.
    if (createError) {
      return (
        <WalletCreateErrorStep
          onRetry={createWallet}
          showSupport={shouldShowSupport(createAttempts.current)}
        />
      )
    }
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
            label={progressLabel}
          />
        )
      case 'pending':
        return (
          <PendingStep
            movedCount={outcome?.moved ?? 0}
            onCheckStatus={onRetry}
            onDismiss={dismiss}
          />
        )
      case 'partial':
        return (
          <PartialRetryStep
            movedCount={outcome?.moved ?? 0}
            failedCount={outcome?.failed ?? 0}
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
