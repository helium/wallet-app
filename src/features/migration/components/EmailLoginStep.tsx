import { Button } from '@ui/Button'
import { buttonTextVariants } from '@ui/buttonVariants'
import { Input } from '@ui/Input'
import { PressableScale } from '@ui/PressableScale'
import { Spinner } from '@ui/Spinner'
import { Text } from '@ui/Text'
import { useLinkEmail, useLoginWithEmail, usePrivy } from '@privy-io/expo'
import * as Logger from '@utils/logger'
import React, { FC, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { resendBackoffSeconds } from '../logic/retry'
import StepBackHeader from './StepBackHeader'
import WorldLoader from './WorldLoader'

// Shared email → OTP login. Uses link-email when a Privy user already exists,
// otherwise login-email. Replaces the duplicated inline component that lived in
// MigrateToWorldModal.tsx.
const EmailLoginStep: FC<{ onBack: () => void; onSuccess: () => void }> = ({
  onBack,
  onSuccess,
}) => {
  const { t } = useTranslation()
  const { user, isReady } = usePrivy()
  const {
    sendCode: loginSendCode,
    loginWithCode,
    state: loginState,
  } = useLoginWithEmail()
  const {
    sendCode: linkSendCode,
    linkWithCode,
    state: linkState,
  } = useLinkEmail()

  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [error, setError] = useState<string>()
  const [resendCount, setResendCount] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(0)

  const emailState = user ? linkState : loginState
  const sending = emailState.status === 'sending-code'
  const verifying = emailState.status === 'submitting-code'

  // A user can only ever link one email to their Privy account. If it's
  // already linked (e.g. re-entering this step after a resumed session),
  // sending another link code throws "User already has one email account
  // linked" — skip straight through instead of showing the form.
  const hasLinkedEmail = !!user?.linked_accounts?.some(
    (a) => a.type === 'email',
  )

  useEffect(() => {
    if (isReady && hasLinkedEmail) onSuccess()
  }, [isReady, hasLinkedEmail, onSuccess])

  useEffect(() => {
    if (secondsLeft <= 0) return undefined
    const id = setTimeout(() => setSecondsLeft(secondsLeft - 1), 1000)
    return () => clearTimeout(id)
  }, [secondsLeft])

  const sendCodeFor = async (count: number) => {
    if (!email) return
    try {
      setError(undefined)
      if (user) await linkSendCode({ email })
      else await loginSendCode({ email })
      setCodeSent(true)
      setResendCount(count)
      setSecondsLeft(resendBackoffSeconds(count))
    } catch (err) {
      Logger.error(err)
      setError((err as Error).message)
    }
  }

  const handleSend = () => sendCodeFor(0)

  const handleResend = () => {
    if (secondsLeft > 0) return
    void sendCodeFor(resendCount + 1)
  }

  const handleVerify = async () => {
    if (!code) return
    try {
      setError(undefined)
      setCompleting(true)
      if (user) await linkWithCode({ code })
      else await loginWithCode({ code })
      onSuccess()
    } catch (err) {
      Logger.error(err)
      setCompleting(false)
      setError((err as Error).message)
    }
  }

  if (!isReady || completing || hasLinkedEmail) {
    return (
      <WorldLoader
        caption={
          completing
            ? t('migrateToWorld.linkEmail.loggingIn')
            : t('generic.loading')
        }
      />
    )
  }

  return (
    <View className="flex-1">
      <StepBackHeader onBack={onBack} />
      <View className="flex-1 px-6">
        <Text size="xl" className="tracking-tight">
          {t('migrateToWorld.linkEmail.title')}
        </Text>
        <Text className="mt-1 leading-[22px] text-muted-foreground">
          {t('migrateToWorld.linkEmail.body')}
        </Text>
        {error ? (
          <Text size="xs" className="mt-4 text-destructive">
            {error}
          </Text>
        ) : null}
        <View className="mt-6">
          <Input
            variant="form"
            testID="MigrateLogin.Input"
            value={codeSent ? code : email}
            onChangeText={codeSent ? setCode : setEmail}
            placeholder={
              codeSent
                ? t('migrateToWorld.linkEmail.codePlaceholder')
                : t('migrateToWorld.linkEmail.emailPlaceholder')
            }
            keyboardType={codeSent ? 'number-pad' : 'email-address'}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Button
            variant="cta"
            size="dashboard"
            className="mt-4 w-full"
            testID={codeSent ? 'MigrateLogin.Verify' : 'MigrateLogin.SendCode'}
            onPress={() =>
              void (codeSent ? handleVerify : handleSend)().catch(console.error)
            }
            disabled={codeSent ? !code || verifying : !email || sending}
          >
            {sending || verifying ? (
              <Spinner size="small" colorClassName="accent-white" />
            ) : null}
            <Text className={buttonTextVariants({ variant: 'cta' })}>
              {codeSent
                ? t('migrateToWorld.linkEmail.verify')
                : t('migrateToWorld.linkEmail.button')}
            </Text>
          </Button>
          {codeSent && (
            <PressableScale
              onPress={handleResend}
              disabled={secondsLeft > 0 || sending}
              feedback="opacity"
              className="mt-2 items-center p-2"
            >
              <Text
                size="xs"
                className={
                  secondsLeft > 0
                    ? 'font-medium text-muted-foreground'
                    : 'font-medium text-purple-700'
                }
              >
                {secondsLeft > 0
                  ? t('migrateToWorld.linkEmail.resendIn', {
                      seconds: secondsLeft,
                    })
                  : t('migrateToWorld.linkEmail.resend')}
              </Text>
            </PressableScale>
          )}
          {codeSent && (
            <PressableScale
              onPress={() => {
                setCodeSent(false)
                setCode('')
              }}
              feedback="opacity"
              className="mt-1 items-center p-2"
            >
              <Text size="xs" className="font-medium text-purple-700">
                {t('migrateToWorld.linkEmail.differentEmail')}
              </Text>
            </PressableScale>
          )}
        </View>
      </View>
    </View>
  )
}

export default EmailLoginStep
