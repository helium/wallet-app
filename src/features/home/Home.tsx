import React, { memo, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from 'react-native'
import {
  GoogleSignin,
  statusCodes,
  User as GoogleUser,
} from '@react-native-google-signin/google-signin'
import {
  GDrive,
  MimeTypes,
} from '@robinbobin/react-native-google-drive-api-wrapper'
import SafeAreaBox from '../../components/SafeAreaBox'
import Text from '../../components/Text'
import {
  CSAccounts,
  useAccountStorage,
} from '../../storage/AccountStorageProvider'
import Box from '../../components/Box'

type GoogleError = { code: unknown }
type File = { id: string; kind: string; mimeType: string; name: string }
const gdrive = new GDrive()
const FILE_NAME = 'WALLET_SETTINGS_DO_NOT_DELETE'

const Home = () => {
  const { accounts, signOut } = useAccountStorage()
  const { t } = useTranslation()
  const [googleUser, setGoogleUser] = useState<GoogleUser>()
  const [downloadedAccounts, setDownloadedAccounts] = useState<CSAccounts>()
  const [files, setFiles] = useState<File[]>()

  const handleAddAccount = useCallback(() => {
    // navigation.navigate('AddAccount', {
    //   screen: 'CreateImport',
    // })
  }, [])

  const handleGoogleSignIn = useCallback(async () => {
    try {
      await GoogleSignin.hasPlayServices()
      const userInfo = await GoogleSignin.signIn({})
      setGoogleUser(userInfo)

      await GoogleSignin.addScopes({
        scopes: ['https://www.googleapis.com/auth/drive.file'],
      })
      gdrive.accessToken = (await GoogleSignin.getTokens()).accessToken

      const result = await gdrive.files.list()
      setFiles(result.files)
    } catch (err) {
      const e = err as GoogleError
      if (e.code === statusCodes.SIGN_IN_CANCELLED) {
        // user cancelled the login flow
      } else if (e.code === statusCodes.IN_PROGRESS) {
        // operation (e.g. sign in) is in progress already
      } else if (e.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        // play services not available or outdated
      } else {
        // some other error happened
      }
    }
  }, [])

  const handleUpload = useCallback(async () => {
    gdrive.files
      .newMultipartUploader()
      .setData(JSON.stringify(accounts), MimeTypes.JSON)
      .setRequestBody({
        name: FILE_NAME,
      })
      .execute()
  }, [accounts])

  const handleDownload = useCallback(async () => {
    if (!files) return

    const file = files.find(({ name }) => name === FILE_NAME)
    if (!file) return

    gdrive.files.getJson(file.id).then(setDownloadedAccounts)
  }, [files])

  const handleSignOut = useCallback(() => signOut(), [signOut])

  return (
    <SafeAreaBox padding="xl" backgroundColor="primaryBackground" flex={1}>
      <Box flexDirection="row" justifyContent="space-around">
        <Button title={t('auth.signOut')} onPress={handleSignOut} />
        <Button title="Add Account" onPress={handleAddAccount} />
        {!googleUser && (
          <Button title="Google Sign In" onPress={handleGoogleSignIn} />
        )}
        {googleUser && <Button title="Upload" onPress={handleUpload} />}
        {googleUser && <Button title="Download" onPress={handleDownload} />}
      </Box>
      {googleUser && (
        <Text
          variant="body1"
          marginTop="l"
        >{`Google Email: ${googleUser.user.email}`}</Text>
      )}
      {downloadedAccounts && (
        <Text
          variant="body1"
          marginTop="l"
        >{`Downloaded Accounts:\n${JSON.stringify(
          downloadedAccounts,
          null,
          2,
        )}`}</Text>
      )}
    </SafeAreaBox>
  )
}

export default memo(Home)
