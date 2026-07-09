import SafeAreaBox from '@components/SafeAreaBox'
import Text from '@components/Text'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import { useNavigation } from '@react-navigation/native'
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { Linking } from 'react-native'
import { Edge } from 'react-native-safe-area-context'
import { useEmbeddedSolanaWallet, usePrivy } from '@privy-io/expo'
import AssetSelectionStep, {
  AssetSelection,
} from './components/AssetSelectionStep'
import EmailLoginStep from './components/EmailLoginStep'
import IntroStep from './components/IntroStep'
import PartialRetryStep from './components/PartialRetryStep'
import ProgressStep from './components/ProgressStep'
import ReviewStep from './components/ReviewStep'
import SuccessStep from './components/SuccessStep'
import { useMigrationAssets } from './hooks/useMigrationAssets'
import { useMigrationExecutor } from './hooks/useMigrationExecutor'
import { useMigrationSession } from './hooks/useMigrationSession'
import { uiToRaw } from './logic/amounts'
import { MigrateInput } from './logic/session'

const WORLD_URL = 'https://world.helium.com'

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

  const { step, setStep, persist, resume } = useMigrationSession(sourceWallet)
  const assets = useMigrationAssets(sourceWallet)
  const { run, progress } = useMigrationExecutor(persist)

  const [selection, setSelection] = useState<AssetSelection>()
  const [outcome, setOutcome] = useState<{ moved: number; failed: number }>()
  const [error, setError] = useState<string>()
  const [progressLabel, setProgressLabel] = useState('')

  // Ensure a destination embedded wallet exists once the user is logged in.
  useEffect(() => {
    if (user && solanaWallet.status === 'not-created' && solanaWallet.create) {
      solanaWallet.create()
    }
  }, [user, solanaWallet])

  // An interrupted session (app closed mid-migration) resumes straight to the
  // partial screen, where retry re-runs the persisted input.
  useEffect(() => {
    if (resume.canResume) setStep('partial')
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
      tokens: Object.entries(sel.tokenAmounts)
        .filter(([, amt]) => amt && amt !== '0')
        .map(([mint, amt]) => {
          const tk = assets.tokens.find((x) => x.mint === mint)
          return { mint, amount: tk ? uiToRaw(amt, tk.decimals) : amt }
        }),
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
          setStep('success')
        } else {
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
    [run, setStep],
  )

  const onConfirm = useCallback(() => {
    if (selection) execute(buildInput(selection))
  }, [selection, buildInput, execute])

  const onRetry = useCallback(() => {
    if (resume.input) execute(resume.input)
    else if (selection) execute(buildInput(selection))
  }, [resume.input, selection, buildInput, execute])

  const goToWorld = useCallback(() => Linking.openURL(WORLD_URL), [])
  const dismiss = useCallback(() => navigation.goBack(), [navigation])

  const tokenLines = useMemo(
    () =>
      selection
        ? Object.entries(selection.tokenAmounts)
            .filter(([, amt]) => amt && amt !== '0')
            .map(([mint, amt]) => {
              const tk = assets.tokens.find((x) => x.mint === mint)
              return `${amt} ${tk?.label ?? mint.slice(0, 4)}`
            })
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
            onDismiss={dismiss}
          />
        )
      case 'login':
        return (
          <EmailLoginStep
            onBack={() => setStep('intro')}
            onSuccess={() => setStep('select')}
          />
        )
      case 'select':
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
