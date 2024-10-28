import axios, { AxiosInstance } from 'axios'
import Config from 'react-native-config'
import { camelCase, mapKeys } from 'lodash'
import { handleAxiosError } from '@utils/axios'

export type SupportedMaker = (typeof SUPPORTED_MAKERS)[number]

export enum VendorSlugs {
  RAKWIRELESS = 'rakwireless',
  HELIUM_MOBILE = 'helium mobile',
}
export const SUPPORTED_MAKERS = [
  VendorSlugs.RAKWIRELESS,
  VendorSlugs.HELIUM_MOBILE,
] as const

const DEFAULT_ANTENNA = 18 // 18 is the model of the outdoor antenna

export type HotspotOnboardingDevice = {
  qr_code: string
  wallet: string
  location: Location
  settings: Settings
}

type Location = {
  latitude: number
  longitude: number
  antenna_id?: number
  height?: number
  height_type?: 'agl' | 'msl'
  azimuth?: number
  mechanical_downtilt?: number
  electrical_downtilt?: number
}

type Settings = {
  public_wifi?: boolean
  public_wifi_throttling?: number
  continuous_connectivity?: boolean
  continuous_connectivity_throttling?: number
}

type DeviceInfoRaw = {
  serial_number: string
  helium_pub_key: string
  manufacturer: string
  device_type: string
  sku: string
  animal_name: string
}

export type DeviceInfo = {
  serialNumber: string
  heliumPubKey: string
  maker: SupportedMaker
  deviceType: 'WifiIndoor' | 'WifiOutdoor'
  sku: string
  animalName: string
}

export type HmhOnboardParams = {
  serial: string
  qrCode: string
  deviceType: 'WifiIndoor' | 'WifiOutdoor'
  location: {
    lat: number
    lng: number
    height?: number
    azimuth?: number
  }
  settings: {
    publicWifi?: boolean
    publicWifiThrottling?: number
    continuousConnectivity?: boolean
    continuousConnectivityThrottling?: number
  }
}

const shouldMock = Config.MOCK_HMH === 'true'

export default class OnboardingV3Client {
  private axios!: AxiosInstance

  constructor(baseURL: string, authKey: string) {
    this.axios = axios.create({
      baseURL: baseURL.endsWith('/') ? baseURL : `${baseURL}/`,
    })
    this.axios.defaults.headers['x-api-key'] = authKey
  }

  async onboardDevice(wallet: string, device: HmhOnboardParams) {
    let success = false
    try {
      const postBody: HotspotOnboardingDevice = {
        qr_code: device.qrCode,
        wallet,
        location: {
          latitude: device.location.lat,
          longitude: device.location.lng,
        },
        settings: {
          continuous_connectivity: device.settings.continuousConnectivity,
          continuous_connectivity_throttling:
            device.settings.continuousConnectivityThrottling,
          public_wifi: device.settings.publicWifi,
          public_wifi_throttling: device.settings.publicWifiThrottling,
        },
      }
      if (device.deviceType === 'WifiOutdoor') {
        postBody.location.antenna_id = DEFAULT_ANTENNA
        postBody.location.height = device.location.height
        postBody.location.height_type = 'agl'
        postBody.location.azimuth = device.location.azimuth
        postBody.location.mechanical_downtilt = 0
        postBody.location.electrical_downtilt = 0
      }

      if (shouldMock) {
        await new Promise((resolve) => setTimeout(resolve, 3000))
        return true
      }

      const response = await this.axios.post<{ status: string }>(
        `onboarding/device/${device.serial}/`,
        postBody,
      )

      success = response.status >= 200 && response.status < 300

      if (!success) {
        throw new Error(
          `Failed with status: ${response.status} ${response.data}`,
        )
      }
    } catch (e) {
      const error = handleAxiosError(e)
      throw new Error(error)
    }

    return success
  }

  async getDeviceInfo(qrCodeB64: string): Promise<DeviceInfo> {
    if (shouldMock) {
      // wait 3 seconds
      await new Promise((resolve) => setTimeout(resolve, 3000))
      return {
        serialNumber: 'HMH-1234-12345678',
        heliumPubKey:
          '1trSuseizDjp9cPghN3TZdxpqZq3ks4jvLruhCE7DxbP87QsLrhTVeRHFN8cwKgtzxEsRy3rVLw8zF8zuy8FZE9JQni5Mu48sbnW8wb8ncNF9968inqNS81eNUCCR6r4zsUwjkRZ6rqgHY2F2RymwgUGNoGGrk9n4j5uRwECD1rvygvTgi6U7BkbaJX3V43HYZRuCiQjsh8ebFeHERXYiRz5oGxczVsPgb17BZnKHgoCH5GxWvu35nRpdSGnDMMiXQLm1ziVvhUPob2C5HqWGEQtNXxdzykTg68LzMcCwrasZECeXgUU7w73Fgg6z7Pw5gQtgD3N8z26ogM2JsRS9PT6qx4dN7wVkuKkWCiWEG31uJ',
        maker: VendorSlugs.HELIUM_MOBILE,
        deviceType: 'WifiIndoor',
        sku: 'HMH-1234',
        animalName: 'angry purple tiger',
      }
    }

    try {
      const response = await this.axios.get<DeviceInfoRaw>(
        `onboarding/device/?qr_code_b64=${qrCodeB64}`,
      )

      // map snake case to camel
      const data = mapKeys(response.data, (_v, k) => camelCase(k))

      return {
        ...data,
        maker: data.manufacturer?.toLowerCase().includes('helium')
          ? VendorSlugs.HELIUM_MOBILE
          : VendorSlugs.RAKWIRELESS,
      } as DeviceInfo
    } catch (e) {
      throw new Error(handleAxiosError(e, false))
    }
  }
}
