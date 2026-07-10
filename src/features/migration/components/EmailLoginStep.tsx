import Box from '@components/Box'
import CircleLoader from '@components/CircleLoader'
import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { useLinkEmail, useLoginWithEmail, usePrivy } from '@privy-io/expo'
import * as Logger from '@utils/logger'
import React, { FC, useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TextInput } from 'react-native'
import { resendBackoffSeconds } from '../logic/retry'
import { WORLD } from '../migrationTheme'
import StepBackHeader from './StepBackHeader'
import WorldButton from './WorldButton'
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

  useEffect(() => {
    if (secondsLeft <= 0) return undefined
    const id = setTimeout(() => setSecondsLeft(secondsLeft - 1), 1000)
    return () => clearTimeout(id)
  }, [secondsLeft])

  const sendCodeFor = useCallback(
    async (count: number) => {
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
    },
    [email, user, linkSendCode, loginSendCode],
  )

  const handleSend = useCallback(() => sendCodeFor(0), [sendCodeFor])

  const handleResend = useCallback(() => {
    if (secondsLeft > 0) return
    sendCodeFor(resendCount + 1)
  }, [secondsLeft, resendCount, sendCodeFor])

  const handleVerify = useCallback(async () => {
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
  }, [code, user, linkWithCode, loginWithCode, onSuccess])

  if (!isReady || completing) {
    return (
      <WorldLoader
        captionVariant="body2"
        caption={
          completing
            ? t('migrateToWorld.linkEmail.loggingIn')
            : t('generic.loading')
        }
      />
    )
  }

  return (
    <Box flex={1}>
      <StepBackHeader onBack={onBack} />
      <Box flex={1} justifyContent="center" paddingHorizontal="l">
        <Text variant="h4" color="primaryText" textAlign="center">
          {t('migrateToWorld.linkEmail.title')}
        </Text>
        <Text
          variant="body2"
          color="secondaryText"
          textAlign="center"
          marginTop="m"
        >
          {t('migrateToWorld.linkEmail.body')}
        </Text>
        {error && (
          <Text variant="body3" color="error" textAlign="center" marginTop="m">
            {error}
          </Text>
        )}
        <Box marginTop="xl">
          <Box
            backgroundColor="surfaceSecondary"
            borderRadius="l"
            paddingHorizontal="m"
          >
            <TextInput
              value={codeSent ? code : email}
              onChangeText={codeSent ? setCode : setEmail}
              placeholder={
                codeSent
                  ? t('migrateToWorld.linkEmail.codePlaceholder')
                  : t('migrateToWorld.linkEmail.emailPlaceholder')
              }
              placeholderTextColor={WORLD.inkFaint}
              style={{ color: WORLD.ink, fontSize: 16, paddingVertical: 14 }}
              keyboardType={codeSent ? 'number-pad' : 'email-address'}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </Box>
          <WorldButton
            title={
              codeSent
                ? t('migrateToWorld.linkEmail.verify')
                : t('migrateToWorld.linkEmail.button')
            }
            onPress={codeSent ? handleVerify : handleSend}
            disabled={codeSent ? !code || verifying : !email || sending}
            marginTop="m"
            LeadingComponent={
              sending || verifying ? (
                <CircleLoader loaderSize={20} color="white" />
              ) : undefined
            }
          />
          {codeSent && (
            <TouchableOpacityBox
              onPress={handleResend}
              disabled={secondsLeft > 0 || sending}
              marginTop="m"
              alignItems="center"
            >
              <Text
                variant="body3"
                color="secondaryText"
                opacity={secondsLeft > 0 ? 0.5 : 1}
              >
                {secondsLeft > 0
                  ? t('migrateToWorld.linkEmail.resendIn', {
                      seconds: secondsLeft,
                    })
                  : t('migrateToWorld.linkEmail.resend')}
              </Text>
            </TouchableOpacityBox>
          )}
          {codeSent && (
            <TouchableOpacityBox
              onPress={() => {
                setCodeSent(false)
                setCode('')
              }}
              marginTop="m"
              alignItems="center"
            >
              <Text variant="body3" color="secondaryText">
                {t('migrateToWorld.linkEmail.differentEmail')}
              </Text>
            </TouchableOpacityBox>
          )}
        </Box>
      </Box>
    </Box>
  )
}

export default EmailLoginStep
