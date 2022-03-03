import React, { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { StyleSheet } from 'react-native'
import { ApolloError } from '@apollo/client'
import Balance, { NetworkTokens, TestNetworkTokens } from '@helium/currency'
import Box from '../../components/Box'
import animateTransition from '../../utils/animateTransition'
import PaymentSubmitLoading from './PaymentSubmitLoading'
import PaymentSuccess from './PaymentSuccess'
import { Payment } from './PaymentItem'
import PaymentError from './PaymentError'

type Props = {
  submitLoading: boolean
  submitError?: ApolloError
  submitSucceeded?: boolean
  totalBalance: Balance<TestNetworkTokens | NetworkTokens>
  feeTokenBalance?: Balance<TestNetworkTokens | NetworkTokens>
  payments: Payment[]
  onRetry: () => void
}

const PaymentSubmit = ({
  submitLoading,
  submitError,
  submitSucceeded,
  totalBalance,
  feeTokenBalance,
  payments,
  onRetry,
}: Props) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ApolloError>()
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

    animateTransition('PaymentSubmit.Loading')
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

    animateTransition('PaymentSubmit.Error')
    setError(submitError)
  }, [error, submitError])

  const containerStyle = useMemo(
    () => [StyleSheet.absoluteFill, { backgroundColor: '#111419' }],
    [],
  )

  const handleVideoEnded = useCallback(() => {
    animateTransition('PaymentSubmit.VideoFinished')

    setVideoFinished(true)
  }, [])

  const body = useMemo(() => {
    if (!videoFinished || (loading && !succeeded && !submitError)) {
      return <PaymentSubmitLoading onVideoEnd={handleVideoEnded} />
    }
    if (videoFinished && succeeded) {
      return (
        <PaymentSuccess
          totalBalance={totalBalance}
          feeTokenBalance={feeTokenBalance}
          payments={payments}
        />
      )
    }

    if (videoFinished && submitError) {
      return (
        <PaymentError
          totalBalance={totalBalance}
          feeTokenBalance={feeTokenBalance}
          payments={payments}
          error={submitError}
          onRetry={handleRetry}
        />
      )
    }
  }, [
    feeTokenBalance,
    handleRetry,
    handleVideoEnded,
    loading,
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
