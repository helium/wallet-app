import { StatusCodes } from '@ledgerhq/errors'
import AppSolana from '@ledgerhq/hw-app-solana'
import type TransportBLE from '@ledgerhq/react-native-hw-transport-ble'
import type TransportHID from '@ledgerhq/react-native-hid'

export type DerivationType =
  | 'root'
  | 'legacy'
  | 'default'
  | 'extended'
  | 'alternative'
  | 'migration'
  | 'change'

const DERIVATION_CONFIG = {
  root: () => "44'/501'",
  legacy: (account: number) => `44'/501'/${account}'`,
  default: (account: number) => `44'/501'/${account}'/0'`,
  extended: (account: number) => `44'/501'/${account}'/0'/0'`,
  alternative: (account: number) => `44'/501'/${account}'/1'`,
  migration: (account: number) => `44'/501'/${account}'/2'`,
  change: (account: number) => `44'/501'/${account}'/0'/1'`,
} as const

const DERIVATION_LABELS = {
  root: 'Root',
  legacy: 'Legacy',
  default: 'Default',
  extended: 'Extended',
  alternative: 'Alternative',
  migration: 'Migration',
  change: 'Change',
} as const

const DERIVATION_PATTERNS = {
  root: /^44'\/501'$/,
  legacy: /^44'\/501'\/\d+'$/,
  default: /^44'\/501'\/\d+'\/0'$/,
  extended: /^44'\/501'\/\d+'\/0'\/0'$/,
  alternative: /^44'\/501'\/\d+'\/1'$/,
  migration: /^44'\/501'\/\d+'\/2'$/,
  change: /^44'\/501'\/\d+'\/0'\/1'$/,
} as const

const FALLBACK_ORDER: DerivationType[] = [
  'legacy',
  'alternative',
  'root',
  'default',
  'extended',
  'migration',
  'change',
]

export const getDerivationPath = (
  account = 0,
  type: DerivationType,
): string => {
  // Handle special case: account -1 should always use root derivation
  if (account === -1) {
    return DERIVATION_CONFIG.root()
  }

  const generator = DERIVATION_CONFIG[type]
  return generator(account)
}

export const getAllDerivationPaths = (
  account = 0,
): Array<{ path: string; type: DerivationType }> => {
  if (account === -1) {
    return [{ path: DERIVATION_CONFIG.root(), type: 'root' }]
  }

  return FALLBACK_ORDER.map((type) => ({
    path: getDerivationPath(account, type),
    type,
  }))
}

export const getDerivationTypeFromPath = (
  derivationPath?: string,
): DerivationType => {
  if (!derivationPath) return 'default'
  const cleanPath = derivationPath.replace(/^m\//, '')

  return (
    (Object.entries(DERIVATION_PATTERNS).find(([, pattern]) =>
      pattern.test(cleanPath),
    )?.[0] as DerivationType) || 'default'
  )
}

export const getDerivationPathLabel = (type: DerivationType): string => {
  return DERIVATION_LABELS[type] || 'Default'
}

export type LedgerErrorKind =
  | 'userRejected'
  | 'locked'
  | 'appNotOpen'
  | 'blindSign'
  | 'transport'
  | 'unknown'

// Message thrown by @ledgerhq/hw-app-solana when blind signing is disabled.
// The status word (0x6808) is swallowed by the library, so the message is the
// only signal available.
const BLIND_SIGN_MESSAGE =
  'Missing a parameter. Try enabling blind signature in the app'

const TRANSPORT_ERROR_NAMES = [
  'DisconnectedDevice',
  'DisconnectedDeviceDuringOperation',
  'CantOpenDevice',
  'PairingFailed',
  'PeerRemovedPairing',
  'TransportOpenUserCancelled',
  'TransportExchangeTimeoutError',
]

const RETRYABLE_RECONNECT_NAMES = [
  'DisconnectedDevice',
  'DisconnectedDeviceDuringOperation',
  'CantOpenDevice',
]

type ErrorLike = {
  name?: string
  message?: string
  statusCode?: number
  errorCode?: number
}

const asErrorLike = (error: unknown): ErrorLike | undefined =>
  error && typeof error === 'object' ? (error as ErrorLike) : undefined

// react-native-ble-plx errors carry a numeric errorCode and are not always
// remapped by the ledger transport (for example a connect timeout).
const isBleError = (error: ErrorLike) => typeof error.errorCode === 'number'

export const classifyLedgerError = (error: unknown): LedgerErrorKind => {
  const err = asErrorLike(error)
  if (!err) return 'unknown'

  switch (err.statusCode) {
    case StatusCodes.CONDITIONS_OF_USE_NOT_SATISFIED:
      return 'userRejected'
    case StatusCodes.LOCKED_DEVICE:
      return 'locked'
    case StatusCodes.INS_NOT_SUPPORTED:
    case StatusCodes.CLA_NOT_SUPPORTED:
      return 'appNotOpen'
    default:
      break
  }

  if (err.message === BLIND_SIGN_MESSAGE) return 'blindSign'

  if (
    (err.name && TRANSPORT_ERROR_NAMES.includes(err.name)) ||
    isBleError(err)
  ) {
    return 'transport'
  }

  return 'unknown'
}

// After the open-app APDU a Nano X drops and re-establishes BLE. During that
// window connect attempts fail with disconnect / cannot-open errors that are
// safe to retry.
export const isRetryableReconnectError = (error: unknown): boolean => {
  const err = asErrorLike(error)
  if (!err) return false
  if (err.name && RETRYABLE_RECONNECT_NAMES.includes(err.name)) return true
  return isBleError(err)
}

const trySignWithFallbacks = async (
  solana: AppSolana,
  accountIndex: number,
  buffer: Buffer,
  signMethod: 'signTransaction' | 'signOffchainMessage',
  primaryType?: DerivationType,
): Promise<Buffer> => {
  const primaryPath = getDerivationPath(accountIndex, primaryType || 'default')

  try {
    const { signature } = await solana[signMethod](primaryPath, buffer)
    return signature
  } catch (error) {
    // If the primary path fails with 0x6a81, try the fallbacks
    if (error?.toString().includes('0x6a81')) {
      for (let i = 0; i < FALLBACK_ORDER.length; i += 1) {
        const type: DerivationType = FALLBACK_ORDER[i]
        try {
          const fallbackPath = getDerivationPath(accountIndex, type)
          const { signature } = await solana[signMethod](fallbackPath, buffer)
          return signature
        } catch (fallbackError) {
          // A rejection on the device ends the flow. Rethrow the original so
          // the caller can classify it by status code.
          if (classifyLedgerError(fallbackError) === 'userRejected') {
            throw fallbackError
          }
        }
      }
    }

    throw error
  }
}

export const signLedgerTransaction = async (
  transport: TransportBLE | TransportHID,
  accountIndex: number,
  txBuffer: Buffer,
  derivationType?: DerivationType | boolean,
) => {
  const solana = new AppSolana(transport)

  const primaryType =
    derivationType === true ? undefined : (derivationType as DerivationType)

  return trySignWithFallbacks(
    solana,
    accountIndex,
    txBuffer,
    'signTransaction',
    primaryType,
  )
}

export const signLedgerMessage = async (
  transport: TransportBLE | TransportHID,
  accountIndex: number,
  msgBuffer: Buffer,
  derivationType?: DerivationType | boolean,
) => {
  const solana = new AppSolana(transport)

  const primaryType =
    derivationType === true ? undefined : (derivationType as DerivationType)

  return trySignWithFallbacks(
    solana,
    accountIndex,
    msgBuffer,
    'signOffchainMessage',
    primaryType,
  )
}

export const getDerivationTypeForSigning = (
  derivationPath?: string,
): DerivationType => {
  return getDerivationTypeFromPath(derivationPath)
}
