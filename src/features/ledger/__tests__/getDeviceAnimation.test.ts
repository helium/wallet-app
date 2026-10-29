import { DeviceModelId } from '@ledgerhq/types-devices'
import { getDeviceAnimation } from '../getDeviceAnimation'

jest.mock('@utils/config', () => ({ __esModule: true, default: {} }), {
  virtual: true,
})

describe('getDeviceAnimation', () => {
  it.each(Object.values(DeviceModelId))(
    'returns a sign animation for %s',
    (modelId) => {
      expect(
        getDeviceAnimation({
          key: 'sign',
          device: { deviceId: 'id', modelId, wired: false },
        }),
      ).toBeDefined()
    },
  )
})
