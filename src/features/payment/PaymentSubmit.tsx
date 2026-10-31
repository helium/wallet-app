import { PublicKey } from '@solana/web3.js'
import { FADE_IN } from '@theme/motion'
import BN from 'bn.js'
import React, { memo, useMemo, useState } from 'react'
import { View } from 'react-native'
import Animated from 'react-native-reanimated'
import { submitStage } from './logic/submitStage'
import PaymentError from './PaymentError'
import { Payment } from './PaymentItem'
import PaymentSubmitLoading from './PaymentSubmitLoading'
import PaymentSuccess from './PaymentSuccess'

type Props = {
  mint: PublicKey
  submitLoading: boolean
  submitError?: Error
  submitSucceeded?: boolean
  totalBalance: BN
  feeTokenBalance?: BN
  payments?: Payment[]
  onRetry?: () => void
  onSuccess: () => void
  actionTitle: string
}

const PaymentSubmit = ({
  mint,
  submitLoading,
  submitError,
  submitSucceeded,
  totalBalance,
  feeTokenBalance,
  payments = [],
  onRetry,
  onSuccess,
  actionTitle,
}: Props) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error>()
  const [succeeded, setSucceeded] = useState(false)

  const handleRetry = useMemo(
    () =>
      onRetry &&
      (() => {
        setError(undefined)
        setSucceeded(false)

        onRetry()
      }),
    [onRetry],
  )

  if (!loading && submitLoading) {
    setLoading(true)
  }

  if (!succeeded && submitSucceeded) {
    setSucceeded(true)
  }

  if (!error && submitError) {
    setError(submitError)
  }

  const body = useMemo(() => {
    const stage = submitStage({ succeeded, hasError: !!submitError })
    switch (stage) {
      case 'loading':
        return <PaymentSubmitLoading />
      case 'success':
        // PaymentSuccess reveals itself, so no fade wraps it.
        return (
          <PaymentSuccess
            mint={mint}
            totalBalance={totalBalance}
            feeTokenBalance={feeTokenBalance}
            payments={payments}
            onSuccess={onSuccess}
            actionTitle={actionTitle}
          />
        )
      case 'error':
        return (
          <Animated.View entering={FADE_IN} className="flex-1">
            <PaymentError
              mint={mint}
              totalBalance={totalBalance}
              feeTokenBalance={feeTokenBalance}
              payments={payments}
              error={submitError}
              onRetry={handleRetry}
            />
          </Animated.View>
        )
      default: {
        const _exhaustive: never = stage
        return _exhaustive
      }
    }
  }, [
    actionTitle,
    feeTokenBalance,
    handleRetry,
    mint,
    onSuccess,
    payments,
    submitError,
    succeeded,
    totalBalance,
  ])

  if (!loading) return null

  return <View className="absolute inset-0 bg-background">{body}</View>
}

export default memo(PaymentSubmit)
