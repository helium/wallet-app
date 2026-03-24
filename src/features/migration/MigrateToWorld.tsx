import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import CircleLoader from '@components/CircleLoader'
import SafeAreaBox from '@components/SafeAreaBox'
import Text from '@components/Text'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import { useNavigation } from '@react-navigation/native'
import { VersionedTransaction } from '@solana/web3.js'
import { useBlockchainApi } from '@storage/BlockchainApiProvider'
import { humanReadable, shortenAddress } from '@utils/formatting'
import Config from 'react-native-config'
import BN from 'bn.js'
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useAsync, useAsyncCallback } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { Linking, ScrollView, TextInput, TouchableOpacity } from 'react-native'
import { Edge } from 'react-native-safe-area-context'
import {
  usePrivy,
  useLoginWithEmail,
  useEmbeddedSolanaWallet,
} from '@privy-io/expo'
import { useSolana } from '../../solana/SolanaProvider'

type MigrationStep =
  | 'link-email'
  | 'create-wallet'
  | 'select-assets'
  | 'confirm'
  | 'migrating'
  | 'success'

interface Hotspot {
  address: string
  entityKey: string
  name: string
  type: string
  deviceType: string
  asset: string
  inWelcomePack: boolean
}

interface Token {
  mint: string
  balance: string
  decimals: number
  uiAmount: number
  symbol?: string
  name?: string
  logoURI?: string
}

// Convert human-readable decimal string back to raw balance string without float precision loss
function uiToRaw(ui: string, decimals: number): string {
  if (decimals === 0) return ui
  const [intPart = '0', fracPart = ''] = ui.split('.')
  const paddedFrac = fracPart.slice(0, decimals).padEnd(decimals, '0')
  const raw = (intPart + paddedFrac).replace(/^0+/, '') || '0'
  return raw
}

const MigrateToWorld = () => {
  const { t } = useTranslation()
  const navigation = useNavigation()
  const edges = useMemo(() => ['top', 'bottom'] as Edge[], [])
  const wallet = useCurrentWallet()
  const client = useBlockchainApi()
  const { anchorProvider } = useSolana()

  const { user, logout } = usePrivy()
  const { sendCode, loginWithCode, state: emailState } = useLoginWithEmail()
  const solanaWallet = useEmbeddedSolanaWallet()

  const hasEmail = user?.linked_accounts?.some((a) => a.type === 'email')
  const emailAccount = user?.linked_accounts?.find((a) => a.type === 'email')
  const userEmail =
    emailAccount && 'address' in emailAccount ? emailAccount.address : undefined
  const embeddedWallet = user?.linked_accounts?.find(
    (a) => a.type === 'wallet' && a.wallet_client === 'privy',
  )

  const initialStep = (): MigrationStep => {
    if (hasEmail && embeddedWallet && 'address' in embeddedWallet) {
      return 'select-assets'
    }
    if (hasEmail) {
      return 'create-wallet'
    }
    return 'link-email'
  }

  const startStep = initialStep()
  const [step, setStep] = useState<MigrationStep>(startStep)
  const [destinationWallet, setDestinationWallet] = useState<
    string | undefined
  >(
    embeddedWallet && 'address' in embeddedWallet
      ? embeddedWallet.address
      : undefined,
  )
  const [hotspots, setHotspots] = useState<Hotspot[]>([])
  const [tokens, setTokens] = useState<Token[]>([])
  const [selectedHotspots, setSelectedHotspots] = useState<Set<string>>(
    new Set(),
  )
  const [tokenAmounts, setTokenAmounts] = useState<Record<string, string>>({})
  const [batchNum, setBatchNum] = useState(0)
  const [emailInput, setEmailInput] = useState('')
  const [codeInput, setCodeInput] = useState('')
  const [emailSent, setEmailSent] = useState(false)

  const sourceWallet = wallet?.toBase58() || ''

  // Step 1: Link email via Privy
  const { execute: handleSendCode, error: sendCodeError } = useAsyncCallback(
    async () => {
      if (!emailInput) return
      await sendCode({ email: emailInput })
      setEmailSent(true)
    },
  )

  const { execute: handleVerifyCode, error: verifyCodeError } =
    useAsyncCallback(async () => {
      if (!codeInput) return
      await loginWithCode({ code: codeInput })
      setStep('create-wallet')
    })

  // Step 3: Load assets
  const {
    execute: loadAssets,
    loading: loadingAssets,
    error: loadAssetsError,
  } = useAsyncCallback(async () => {
    if (!sourceWallet) return

    const [hotspotsResult, tokensResult] = await Promise.all([
      client.migration.getHotspots({ walletAddress: sourceWallet }),
      client.tokens.getBalances({ walletAddress: sourceWallet }),
    ])

    setHotspots(hotspotsResult.hotspots as Hotspot[])
    setSelectedHotspots(
      new Set(hotspotsResult.hotspots.map((h) => h.entityKey)),
    )

    const splTokens = tokensResult.tokens.filter(
      (tk) => tk.uiAmount > 0,
    ) as Token[]

    // Add native SOL to the token list using the WSOL mint
    const solBalance = (tokensResult as any).solBalance as number | undefined
    const tokenList =
      solBalance && solBalance > 0
        ? [
            {
              mint: 'So11111111111111111111111111111111111111112',
              balance: String(Math.round(solBalance * 1e9)),
              decimals: 9,
              uiAmount: solBalance,
              symbol: 'SOL',
              name: 'SOL',
            } as Token,
            ...splTokens,
          ]
        : splTokens
    setTokens(tokenList)

    const amounts: Record<string, string> = {}
    tokenList.forEach((tk) => {
      amounts[tk.mint] = humanReadable(new BN(tk.balance), tk.decimals) || '0'
    })
    setTokenAmounts(amounts)
  })

  // Re-fetch assets every time the screen is focused
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (step === 'select-assets') {
        loadAssets()
      }
    })
    return unsubscribe
  }, [navigation, step, loadAssets])

  // Load assets on mount if we already have email + wallet
  useAsync(async () => {
    if (initialStep() === 'select-assets') {
      await loadAssets()
    }
  }, [])

  // Watch for solana wallet becoming connected (after create or on mount)
  useEffect(() => {
    if (
      solanaWallet.status === 'connected' &&
      solanaWallet.wallets?.length > 0 &&
      step === 'create-wallet'
    ) {
      setDestinationWallet(solanaWallet.wallets[0].address)
      setStep('select-assets')
      loadAssets()
    }
  }, [solanaWallet.status, step, loadAssets, solanaWallet.wallets])

  // Step 2: Create embedded wallet
  const {
    execute: handleCreateWallet,
    loading: creatingWallet,
    error: createWalletError,
  } = useAsyncCallback(async () => {
    // Check if wallet already exists on the user object
    const privyWallet = user?.linked_accounts?.find(
      (account) =>
        account.type === 'wallet' && account.wallet_client === 'privy',
    )

    if (privyWallet && 'address' in privyWallet) {
      setDestinationWallet(privyWallet.address)
      setStep('select-assets')
      await loadAssets()
      return
    }

    // If already connected via the hook
    if (
      solanaWallet.status === 'connected' &&
      solanaWallet.wallets?.length > 0
    ) {
      setDestinationWallet(solanaWallet.wallets[0].address)
      setStep('select-assets')
      await loadAssets()
      return
    }

    // No existing wallet - create one via the SDK
    if (solanaWallet.status === 'not-created' && solanaWallet.create) {
      await solanaWallet.create()
      // The useEffect above will handle the transition when status becomes 'connected'
      return
    }

    throw new Error('No embedded wallet found. Please try again.')
  })

  const { execute: handleLogout, error: logoutError } = useAsyncCallback(
    async () => {
      await logout()
      setDestinationWallet(undefined)
      setHotspots([])
      setTokens([])
      setSelectedHotspots(new Set())
      setTokenAmounts({})
      setEmailInput('')
      setCodeInput('')
      setEmailSent(false)
      setStep('link-email')
    },
  )

  const toggleHotspot = useCallback((address: string) => {
    setSelectedHotspots((prev) => {
      const next = new Set(prev)
      if (next.has(address)) {
        next.delete(address)
      } else {
        next.add(address)
      }
      return next
    })
  }, [])

  const toggleAllHotspots = useCallback(() => {
    if (selectedHotspots.size === hotspots.length) {
      setSelectedHotspots(new Set())
    } else {
      setSelectedHotspots(new Set(hotspots.map((h) => h.entityKey)))
    }
  }, [selectedHotspots, hotspots])

  const setMaxTokenAmount = useCallback(
    (mint: string) => {
      const token = tokens.find((tk) => tk.mint === mint)
      if (token) {
        setTokenAmounts((prev) => ({
          ...prev,
          [mint]: humanReadable(new BN(token.balance), token.decimals) || '0',
        }))
      }
    },
    [tokens],
  )

  const updateTokenAmount = useCallback((mint: string, amount: string) => {
    setTokenAmounts((prev) => ({ ...prev, [mint]: amount }))
  }, [])

  // Step 5: Execute migration
  const { execute: handleMigrate, error: migrateError } = useAsyncCallback(
    async () => {
      if (!anchorProvider || !destinationWallet) return

      setStep('migrating')
      setBatchNum(1)

      try {
        const selectedTokens = Object.entries(tokenAmounts)
          .filter(([_, amount]) => amount && amount !== '0')
          .map(([mint, amount]) => {
            const token = tokens.find((tk) => tk.mint === mint)
            return {
              mint,
              amount: token ? uiToRaw(amount, token.decimals) : amount,
            }
          })

        let currentParams = {
          sourceWallet,
          destinationWallet,
          hotspots: Array.from(selectedHotspots),
          tokens: selectedTokens,
        }

        let hasMore = true
        let batch = 1

        while (hasMore) {
          setBatchNum(batch)

          // eslint-disable-next-line no-await-in-loop
          const migrateResponse = await fetch(
            `${Config.WALLET_REST_URI}/migrate`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(currentParams),
            },
          )
          if (!migrateResponse.ok) {
            const errBody = await migrateResponse.json().catch(() => ({}))
            throw new Error(
              errBody.message || t('migrateToWorld.error.generic'),
            )
          }
          // eslint-disable-next-line no-await-in-loop
          const result = await migrateResponse.json()
          const { transactionData } = result

          // Deserialize transactions
          const txs = transactionData.transactions.map((txData) =>
            VersionedTransaction.deserialize(
              Buffer.from(txData.serializedTransaction, 'base64'),
            ),
          )

          // Sign with source wallet
          // eslint-disable-next-line no-await-in-loop
          const signedTxs = await anchorProvider.wallet.signAllTransactions(txs)

          // Re-serialize signed transactions
          const signedTransactionData = {
            ...transactionData,
            transactions: signedTxs.map((tx, i) => ({
              serializedTransaction: Buffer.from(tx.serialize()).toString(
                'base64',
              ),
              metadata: transactionData.transactions[i].metadata,
            })),
          }

          // Submit
          // eslint-disable-next-line no-await-in-loop
          const { batchId } = await client.transactions.submit(
            signedTransactionData,
          )

          // Poll for confirmation
          let confirmed = false
          const startTime = Date.now()
          const maxPollTime = 60000

          while (!confirmed && Date.now() - startTime < maxPollTime) {
            // eslint-disable-next-line no-await-in-loop
            const status = await client.transactions.get({
              id: batchId,
              commitment: 'confirmed',
            })

            if (status.status === 'confirmed') {
              confirmed = true
            } else if (
              status.status === 'failed' ||
              status.status === 'expired'
            ) {
              throw new Error(t('migrateToWorld.error.generic'))
            } else {
              // eslint-disable-next-line no-await-in-loop
              await new Promise((resolve) => setTimeout(resolve, 2000))
            }
          }

          if (!confirmed) {
            throw new Error(t('migrateToWorld.error.generic'))
          }

          if (result.hasMore && result.nextParams) {
            currentParams = {
              sourceWallet: result.nextParams.sourceWallet,
              destinationWallet: result.nextParams.destinationWallet,
              hotspots: result.nextParams.hotspots || [],
              tokens: result.nextParams.tokens || [],
            }
            batch += 1
          } else {
            hasMore = false
          }
        }

        setStep('success')
      } catch (err) {
        setStep('confirm')
        throw err
      }
    },
  )

  const error = (
    sendCodeError ||
    verifyCodeError ||
    loadAssetsError ||
    createWalletError ||
    logoutError ||
    migrateError
  )?.message

  const loading = loadingAssets || creatingWallet

  const handleGoToWorld = useCallback(() => {
    Linking.openURL('https://world.helium.com')
  }, [])

  const handleBack = useCallback(() => {
    setStep((current) => {
      if (current === startStep) {
        navigation.goBack()
        return current
      }
      const order: MigrationStep[] = [
        'link-email',
        'create-wallet',
        'select-assets',
        'confirm',
      ]
      const idx = order.indexOf(current)
      if (idx > 0) {
        return order[idx - 1]
      }
      navigation.goBack()
      return current
    })
  }, [navigation, startStep])

  const renderLinkEmail = () => (
    <Box flex={1} paddingHorizontal="m">
      <TouchableOpacity onPress={handleBack}>
        <Text variant="body2" color="secondaryText" marginBottom="m">
          ← Back
        </Text>
      </TouchableOpacity>
      <Box flex={1} justifyContent="center">
        <Text variant="h4" color="white" textAlign="center" marginBottom="m">
          {t('migrateToWorld.linkEmail.title')}
        </Text>
        <Text
          variant="body3Medium"
          color="white"
          opacity={0.6}
          textAlign="center"
          marginBottom="l"
        >
          {t('migrateToWorld.linkEmail.body')}
        </Text>

        {!emailSent ? (
          <Box>
            <Box
              backgroundColor="black600"
              borderRadius="l"
              padding="m"
              marginBottom="m"
            >
              <TextInput
                value={emailInput}
                onChangeText={setEmailInput}
                placeholder="Enter your email address"
                placeholderTextColor="rgba(255,255,255,0.4)"
                style={{ color: 'white', fontSize: 16 }}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </Box>
            <ButtonPressable
              width="100%"
              borderRadius="round"
              backgroundColor="white"
              backgroundColorOpacityPressed={0.7}
              titleColorPressedOpacity={0.3}
              titleColor="black"
              title={t('migrateToWorld.linkEmail.button')}
              onPress={handleSendCode}
              disabled={!emailInput || emailState.status === 'sending-code'}
            />
          </Box>
        ) : (
          <Box>
            <Box
              backgroundColor="black600"
              borderRadius="l"
              padding="m"
              marginBottom="m"
            >
              <TextInput
                value={codeInput}
                onChangeText={setCodeInput}
                placeholder="Enter verification code"
                placeholderTextColor="rgba(255,255,255,0.4)"
                style={{ color: 'white', fontSize: 16 }}
                keyboardType="number-pad"
              />
            </Box>
            <ButtonPressable
              width="100%"
              borderRadius="round"
              backgroundColor="white"
              backgroundColorOpacityPressed={0.7}
              titleColorPressedOpacity={0.3}
              titleColor="black"
              title="Verify Code"
              onPress={handleVerifyCode}
              disabled={!codeInput || emailState.status === 'submitting-code'}
            />
          </Box>
        )}
      </Box>
    </Box>
  )

  const renderCreateWallet = () => (
    <Box flex={1} paddingHorizontal="m">
      <TouchableOpacity onPress={handleBack}>
        <Text variant="body2" color="secondaryText" marginBottom="m">
          ← Back
        </Text>
      </TouchableOpacity>
      <Box flex={1} justifyContent="center">
        <Text variant="h4" color="white" textAlign="center" marginBottom="m">
          {t('migrateToWorld.createWallet.title')}
        </Text>
        <Text
          variant="body3Medium"
          color="white"
          opacity={0.6}
          textAlign="center"
          marginBottom="l"
        >
          {t('migrateToWorld.createWallet.body')}
        </Text>
        {loading ? (
          <CircleLoader loaderSize={30} color="white" />
        ) : (
          <ButtonPressable
            width="100%"
            borderRadius="round"
            backgroundColor="white"
            backgroundColorOpacityPressed={0.7}
            titleColorPressedOpacity={0.3}
            titleColor="black"
            title={t('migrateToWorld.createWallet.button')}
            onPress={handleCreateWallet}
          />
        )}
      </Box>
    </Box>
  )

  const renderSelectAssets = () => (
    <Box flex={1} paddingHorizontal="m">
      <TouchableOpacity onPress={handleBack}>
        <Text variant="body2" color="secondaryText" marginBottom="m">
          ← Back
        </Text>
      </TouchableOpacity>
      <Text variant="h4" color="white" textAlign="center" marginBottom="m">
        {t('migrateToWorld.selectAssets.title')}
      </Text>

      <Box
        backgroundColor="black600"
        borderRadius="l"
        padding="m"
        marginBottom="m"
      >
        {userEmail && (
          <Box
            flexDirection="row"
            justifyContent="space-between"
            alignItems="center"
            marginBottom="xs"
          >
            <Text variant="body3" color="white" opacity={0.6}>
              Email
            </Text>
            <Text variant="body3Medium" color="white">
              {userEmail}
            </Text>
          </Box>
        )}
        {destinationWallet && (
          <Box
            flexDirection="row"
            justifyContent="space-between"
            alignItems="center"
            marginBottom="xs"
          >
            <Text variant="body3" color="white" opacity={0.6}>
              New Wallet
            </Text>
            <Text variant="body3Medium" color="white">
              {shortenAddress(destinationWallet, 8)}
            </Text>
          </Box>
        )}
        <TouchableOpacity onPress={handleLogout}>
          <Text
            variant="body3"
            color="blueBright500"
            textAlign="center"
            marginTop="xs"
          >
            Log out and use a different email
          </Text>
        </TouchableOpacity>
      </Box>

      {loading ? (
        <Box flex={1} justifyContent="center" alignItems="center">
          <CircleLoader loaderSize={30} color="white" />
          <Text variant="body3" color="white" opacity={0.6} marginTop="m">
            {t('migrateToWorld.selectAssets.loading')}
          </Text>
        </Box>
      ) : (
        <ScrollView>
          {/* Hotspots */}
          <Box marginBottom="m">
            <Box
              flexDirection="row"
              justifyContent="space-between"
              alignItems="center"
              marginBottom="s"
            >
              <Text variant="body2Medium" color="white">
                {t('migrateToWorld.selectAssets.hotspots')}
              </Text>
              {hotspots.length > 0 && (
                <TouchableOpacity onPress={toggleAllHotspots}>
                  <Text variant="body3" color="blueBright500">
                    {selectedHotspots.size === hotspots.length
                      ? t('migrateToWorld.selectAssets.deselectAll')
                      : t('migrateToWorld.selectAssets.selectAll')}
                  </Text>
                </TouchableOpacity>
              )}
            </Box>
            {hotspots.length === 0 ? (
              <Text variant="body3" color="white" opacity={0.5}>
                {t('migrateToWorld.selectAssets.noHotspots')}
              </Text>
            ) : (
              hotspots.map((hotspot) => (
                <TouchableOpacity
                  key={hotspot.entityKey}
                  onPress={() => toggleHotspot(hotspot.entityKey)}
                >
                  <Box
                    backgroundColor="black600"
                    borderRadius="l"
                    padding="m"
                    marginBottom="xs"
                    flexDirection="row"
                    alignItems="center"
                  >
                    <Box
                      width={20}
                      height={20}
                      borderRadius="round"
                      borderWidth={2}
                      borderColor="white"
                      backgroundColor={
                        selectedHotspots.has(hotspot.entityKey)
                          ? 'blueBright500'
                          : 'transparent'
                      }
                      marginRight="m"
                    />
                    <Box flex={1}>
                      <Text variant="body3Medium" color="white">
                        {hotspot.name}
                      </Text>
                      <Text variant="body3" color="white" opacity={0.5}>
                        {hotspot.type} - {hotspot.deviceType}
                      </Text>
                    </Box>
                  </Box>
                </TouchableOpacity>
              ))
            )}
          </Box>

          {/* Tokens */}
          <Box marginBottom="m">
            <Text variant="body2Medium" color="white" marginBottom="s">
              {t('migrateToWorld.selectAssets.tokens')}
            </Text>
            {tokens.length === 0 ? (
              <Text variant="body3" color="white" opacity={0.5}>
                {t('migrateToWorld.selectAssets.noTokens')}
              </Text>
            ) : (
              tokens.map((token) => (
                <Box
                  key={token.mint}
                  backgroundColor="black600"
                  borderRadius="l"
                  padding="m"
                  marginBottom="xs"
                >
                  <Box
                    flexDirection="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Text variant="body3Medium" color="white">
                      {token.symbol || token.name || token.mint.slice(0, 8)}
                    </Text>
                    <TouchableOpacity
                      onPress={() => setMaxTokenAmount(token.mint)}
                    >
                      <Text variant="body3" color="blueBright500">
                        Max
                      </Text>
                    </TouchableOpacity>
                  </Box>
                  <Text variant="body3" color="white" opacity={0.5}>
                    Balance:{' '}
                    {humanReadable(new BN(token.balance), token.decimals)}
                  </Text>
                  <Box
                    backgroundColor="black"
                    borderRadius="m"
                    paddingHorizontal="s"
                    paddingVertical="xs"
                    marginTop="xs"
                  >
                    <TextInput
                      value={tokenAmounts[token.mint] || ''}
                      onChangeText={(val) => updateTokenAmount(token.mint, val)}
                      placeholder="0"
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      style={{ color: 'white', fontSize: 14 }}
                      keyboardType="decimal-pad"
                    />
                  </Box>
                </Box>
              ))
            )}
          </Box>
        </ScrollView>
      )}

      {!loading && (
        <ButtonPressable
          width="100%"
          borderRadius="round"
          backgroundColor="white"
          backgroundColorOpacityPressed={0.7}
          titleColorPressedOpacity={0.3}
          titleColor="black"
          title={t('migrateToWorld.selectAssets.review')}
          onPress={() => setStep('confirm')}
          marginBottom="m"
          disabled={
            selectedHotspots.size === 0 &&
            !Object.values(tokenAmounts).some((a) => a && a !== '0')
          }
        />
      )}
    </Box>
  )

  const renderConfirm = () => (
    <Box flex={1} paddingHorizontal="m">
      <TouchableOpacity onPress={handleBack}>
        <Text variant="body2" color="secondaryText" marginBottom="m">
          ← Back
        </Text>
      </TouchableOpacity>
      <Text variant="h4" color="white" marginBottom="l">
        {t('migrateToWorld.confirm.title')}
      </Text>

      <Box marginBottom="l">
        <Text variant="body3" color="secondaryText" marginBottom="xs">
          {t('migrateToWorld.confirm.source')}
        </Text>
        <Text variant="body2Medium" color="white">
          {shortenAddress(sourceWallet, 8)}
        </Text>
      </Box>

      <Box marginBottom="l">
        <Text variant="body3" color="secondaryText" marginBottom="xs">
          {t('migrateToWorld.confirm.destination')}
        </Text>
        <Text variant="body2Medium" color="white">
          {shortenAddress(destinationWallet || '', 8)}
        </Text>
      </Box>

      {selectedHotspots.size > 0 && (
        <Box marginBottom="m">
          <Text variant="body3" color="secondaryText" marginBottom="xs">
            Hotspots
          </Text>
          <Text variant="body2Medium" color="white">
            {selectedHotspots.size} Hotspot
            {selectedHotspots.size !== 1 ? 's' : ''}
          </Text>
        </Box>
      )}

      {Object.entries(tokenAmounts)
        .filter(([_, amount]) => amount && amount !== '0')
        .map(([mint]) => {
          const token = tokens.find((tk) => tk.mint === mint)
          return (
            <Box key={mint} marginBottom="xs">
              <Text variant="body2Medium" color="white">
                {tokenAmounts[mint]} {token?.symbol || mint.slice(0, 8)}
              </Text>
            </Box>
          )
        })}

      <Box flex={1} />

      <ButtonPressable
        width="100%"
        height={60}
        borderRadius="round"
        backgroundColor="white"
        backgroundColorOpacityPressed={0.7}
        titleColorPressedOpacity={0.3}
        titleColor="black"
        title={t('migrateToWorld.confirm.button')}
        onPress={handleMigrate}
        marginBottom="m"
      />
    </Box>
  )

  const renderMigrating = () => (
    <Box flex={1} justifyContent="center" alignItems="center">
      <CircleLoader loaderSize={40} color="white" />
      <Text variant="h4" color="white" marginTop="l">
        {t('migrateToWorld.migrating.title')}
      </Text>
      <Text variant="body3" color="white" opacity={0.6} marginTop="m">
        {t('migrateToWorld.migrating.batch', { num: batchNum })}
      </Text>
    </Box>
  )

  const renderSuccess = () => (
    <Box flex={1} justifyContent="center" paddingHorizontal="m">
      <Text variant="h4" color="white" textAlign="center" marginBottom="m">
        {t('migrateToWorld.success.title')}
      </Text>
      <Text
        variant="body3Medium"
        color="white"
        opacity={0.6}
        textAlign="center"
        marginBottom="l"
      >
        {t('migrateToWorld.success.body')}
      </Text>
      <ButtonPressable
        width="100%"
        borderRadius="round"
        backgroundColor="white"
        backgroundColorOpacityPressed={0.7}
        titleColorPressedOpacity={0.3}
        titleColor="black"
        title={t('migrateToWorld.success.goToWorld')}
        onPress={handleGoToWorld}
        marginBottom="m"
      />
      <ButtonPressable
        width="100%"
        borderRadius="round"
        backgroundColor="transparent"
        backgroundColorOpacityPressed={0.7}
        titleColorPressedOpacity={0.3}
        titleColor="white"
        title={t('migrateToWorldModal.dismiss')}
        onPress={() => navigation.goBack()}
      />
    </Box>
  )

  const renderStep = () => {
    switch (step) {
      case 'link-email':
        return renderLinkEmail()
      case 'create-wallet':
        return renderCreateWallet()
      case 'select-assets':
        return renderSelectAssets()
      case 'confirm':
        return renderConfirm()
      case 'migrating':
        return renderMigrating()
      case 'success':
        return renderSuccess()
      default:
        return null
    }
  }

  return (
    <SafeAreaBox edges={edges} flex={1} backgroundColor="primaryBackground">
      {error && (
        <Box paddingHorizontal="m" paddingTop="m">
          <Text variant="body3Medium" color="red500" textAlign="center">
            {error}
          </Text>
        </Box>
      )}
      {renderStep()}
    </SafeAreaBox>
  )
}

export default memo(MigrateToWorld)
