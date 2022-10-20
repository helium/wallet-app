import React, { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { StyleSheet } from 'react-native'
import { ApolloError } from '@apollo/client'
import Balance, { NetworkTokens, TestNetworkTokens } from '@helium/currency'
import { SerializedError } from '@reduxjs/toolkit'
import Box from '../../components/Box'
import PaymentSubmitLoading from './PaymentSubmitLoading'
import PaymentSuccess from './PaymentSuccess'
import { Payment } from './PaymentItem'
import PaymentError from './PaymentError'
import FadeInOut from '../../components/FadeInOut'
import globalStyles from '../../theme/globalStyles'

type Props = {
  submitLoading: boolean
  submitError?: ApolloError | Error | SerializedError
  submitSucceeded?: boolean
  totalBalance: Balance<TestNetworkTokens | NetworkTokens>
  feeTokenBalance?: Balance<TestNetworkTokens | NetworkTokens>
  payments?: Payment[]
  onRetry: () => void
  onSuccess: () => void
  actionTitle: string
}

const PaymentSubmit = ({
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
  const [error, setError] = useState<ApolloError | Error | SerializedError>()
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
