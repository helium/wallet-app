import Box from '@components/Box'
import FadeInOut from '@components/FadeInOut'
import { SerializedError } from '@reduxjs/toolkit'
import { PublicKey } from '@solana/web3.js'
import globalStyles from '@theme/globalStyles'
import BN from 'bn.js'
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { StyleSheet } from 'react-native'
import PaymentError from './PaymentError'
import { Payment } from './PaymentItem'
import PaymentSubmitLoading from './PaymentSubmitLoading'
import PaymentSuccess from './PaymentSuccess'

type Props = {
  mint: PublicKey
  submitLoading: boolean
  submitError?: Error | SerializedError
  submitSucceeded?: boolean
  totalBalance: BN
  feeTokenBalance?: BN
  payments?: Payment[]
  onRetry: () => void
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
  const [error, setError] = useState<Error | SerializedError>()
  const [succeeded, setSucceeded] = useState(false)
  const [videoFinished, setVideoFinished] = useState(false)

  const handleRetry = useCallback(() => {
    setError(undefined)
    setSucceeded(false)
    setVideoFinished(false)

    onRetry()
  }, [onRetry])

  useEffect(() => {
    if (loading || !submitLoading) {
      return
    }

    setLoading(true)
  }, [loading, submitLoading])

  useEffect(() => {
    if (succeeded || !submitSucceeded) {
      return
    }

    setSucceeded(true)
  }, [submitSucceeded, succeeded])

  useEffect(() => {
    if (error || !submitError) {
      return
    }

    setError(submitError)
  }, [error, submitError])

  const containerStyle = useMemo(
    () => [StyleSheet.absoluteFill, { backgroundColor: '#111419' }],
    [],
  )

  const handleVideoEnded = useCallback(() => {
    setVideoFinished(true)
  }, [])

  const body = useMemo(() => {
    if (!videoFinished || (loading && !succeeded && !submitError)) {
      return <PaymentSubmitLoading onVideoEnd={handleVideoEnded} />
    }
    if (videoFinished && succeeded) {
      return (
        <FadeInOut style={globalStyles.container}>
          <PaymentSuccess
            mint={mint}
            totalBalance={totalBalance}
            feeTokenBalance={feeTokenBalance}
            payments={payments}
            onSuccess={onSuccess}
            actionTitle={actionTitle}
          />
        </FadeInOut>
      )
    }

    if (videoFinished && submitError) {
      return (
        <FadeInOut style={globalStyles.container}>
          <PaymentError
            mint={mint}
            totalBalance={totalBalance}
            feeTokenBalance={feeTokenBalance}
            payments={payments}
            error={submitError}
            onRetry={handleRetry}
          />
        </FadeInOut>
      )
    }
  }, [
    actionTitle,
    feeTokenBalance,
    handleRetry,
    handleVideoEnded,
    loading,
    mint,
    onSuccess,
    payments,
    submitError,
    succeeded,
    totalBalance,
    videoFinished,
  ])

  if (!loading) return null

  return <Box style={containerStyle}>{body}</Box>
}

export default memo(PaymentSubmit)
