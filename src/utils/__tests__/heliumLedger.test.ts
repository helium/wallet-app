import {
  CantOpenDevice,
  DisconnectedDevice,
  DisconnectedDeviceDuringOperation,
  PairingFailed,
  StatusCodes,
  TransportStatusError,
} from '@ledgerhq/errors'
import { classifyLedgerError, isRetryableReconnectError } from '../heliumLedger'

describe('classifyLedgerError', () => {
  it('maps 0x6985 to userRejected', () => {
    const err = new TransportStatusError(
      StatusCodes.CONDITIONS_OF_USE_NOT_SATISFIED,
    )
    expect(classifyLedgerError(err)).toBe('userRejected')
  })

  it('maps 0x5515 to locked, including the LockedDeviceError subclass', () => {
    const err = new TransportStatusError(StatusCodes.LOCKED_DEVICE)
    expect(err.name).toBe('LockedDeviceError')
    expect(classifyLedgerError(err)).toBe('locked')
  })

  it('maps 0x6d00 and 0x6e00 to appNotOpen', () => {
    expect(
      classifyLedgerError(
        new TransportStatusError(StatusCodes.INS_NOT_SUPPORTED),
      ),
    ).toBe('appNotOpen')
    expect(
      classifyLedgerError(
        new TransportStatusError(StatusCodes.CLA_NOT_SUPPORTED),
      ),
    ).toBe('appNotOpen')
  })

  it('maps the hw-app-solana blind sign message to blindSign', () => {
    expect(
      classifyLedgerError(
        new Error(
          'Missing a parameter. Try enabling blind signature in the app',
        ),
      ),
    ).toBe('blindSign')
  })

  it('maps transport errors by name', () => {
    expect(classifyLedgerError(new DisconnectedDevice())).toBe('transport')
    expect(classifyLedgerError(new DisconnectedDeviceDuringOperation())).toBe(
      'transport',
    )
    expect(classifyLedgerError(new CantOpenDevice())).toBe('transport')
    expect(classifyLedgerError(new PairingFailed())).toBe('transport')
  })

  it('maps a connect timeout from ble-plx to transport', () => {
    const bleError = Object.assign(new Error('Operation timed out'), {
      errorCode: 3,
    })
    expect(classifyLedgerError(bleError)).toBe('transport')
  })

  it('maps anything else to unknown', () => {
    expect(classifyLedgerError(new Error('boom'))).toBe('unknown')
    expect(
      classifyLedgerError(new TransportStatusError(StatusCodes.INCORRECT_DATA)),
    ).toBe('unknown')
    expect(classifyLedgerError(undefined)).toBe('unknown')
    expect(classifyLedgerError('a string')).toBe('unknown')
  })
})

describe('isRetryableReconnectError', () => {
  it('retries disconnect and cant-open errors', () => {
    expect(isRetryableReconnectError(new DisconnectedDevice())).toBe(true)
    expect(
      isRetryableReconnectError(new DisconnectedDeviceDuringOperation()),
    ).toBe(true)
    expect(isRetryableReconnectError(new CantOpenDevice())).toBe(true)
  })

  it('retries raw ble-plx errors', () => {
    const bleError = Object.assign(new Error('Device was disconnected'), {
      errorCode: 201,
    })
    expect(isRetryableReconnectError(bleError)).toBe(true)
  })

  it('does not retry status errors or pairing failures', () => {
    expect(
      isRetryableReconnectError(
        new TransportStatusError(StatusCodes.LOCKED_DEVICE),
      ),
    ).toBe(false)
    expect(isRetryableReconnectError(new PairingFailed())).toBe(false)
    expect(isRetryableReconnectError(new Error('boom'))).toBe(false)
  })
})
