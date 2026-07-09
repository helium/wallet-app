import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import CircleLoader from '@components/CircleLoader'
import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { useLinkEmail, useLoginWithEmail, usePrivy } from '@privy-io/expo'
import React, { FC, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TextInput } from 'react-native'
import * as Logger from '../../../utils/logger'
import { WORLD } from '../migrationTheme'

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

  const emailState = user ? linkState : loginState
  const sending = emailState.status === 'sending-code'
  const verifying = emailState.status === 'submitting-code'

  const handleSend = useCallback(async () => {
    if (!email) return
    try {
      setError(undefined)
      if (user) await linkSendCode({ email })
      else await loginSendCode({ email })
      setCodeSent(true)
    } catch (err) {
      Logger.error(err)
      setError((err as Error).message)
    }
  }, [email, user, linkSendCode, loginSendCode])

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
      <Box flex={1} justifyContent="center" alignItems="center">
        <CircleLoader loaderSize={30} color="worldPurple" />
        <Text variant="body2" color="secondaryText" marginTop="m">
          {completing
            ? t('migrateToWorld.linkEmail.loggingIn')
            : t('generic.loading')}
        </Text>
      </Box>
    )
  }

  return (
    <Box flex={1}>
      <TouchableOpacityBox
        onPress={onBack}
        paddingHorizontal="l"
        paddingVertical="m"
      >
        <Text variant="body2" color="secondaryText">
          ← {t('generic.back')}
        </Text>
      </TouchableOpacityBox>
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
          <Text variant="body3" color="red500" textAlign="center" marginTop="m">
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
                  : 'you@example.com'
              }
              placeholderTextColor={WORLD.inkFaint}
              style={{ color: WORLD.ink, fontSize: 16, paddingVertical: 14 }}
              keyboardType={codeSent ? 'number-pad' : 'email-address'}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </Box>
          <ButtonPressable
            width="100%"
            height={60}
            borderRadius="round"
            backgroundColor="worldPurple"
            backgroundColorOpacityPressed={0.7}
            titleColor="white"
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
