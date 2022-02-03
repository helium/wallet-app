import Config from 'react-native-config'
import camelcaseKeys from 'camelcase-keys'
import snakecaseKeys from 'snakecase-keys'

type Session = {
  amount: number
  macid: string
  type: string
  used: number
}
export type ScAccount = {
  height?: number
  payee: string
  price?: number
  dcPayloadSize: number
  txnFeeMultiplier: number
  user: {
    balance: number
    dcBalance: number
    memo: string
    nonce: number
    sessions: Array<Session>
  }
}

export type SessionType = 'data' | 'time'

const makeRequest = async (url: string, opts: RequestInit = {}) => {
  const route = [Config.SC_MANAGER_BASE_URL, url].join('/')
  const requestOptions: RequestInit = {
    ...opts,
    headers: {
      ...opts.headers,
      'Content-Type': 'application/json',
    },
  }

  const response = await fetch(route, requestOptions)
  const text = await response.text()
  try {
    const json = JSON.parse(text)
    return json.data || json
  } catch (err) {
    throw new Error(text)
  }
}

export const getScManager = async (url: string) => makeRequest(url)

export const postScManager = async (url: string, data?: unknown) =>
  makeRequest(url, { method: 'POST', body: data ? JSON.stringify(data) : null })

export const getMacForIp = async (gateway: string, wifiIp: string) => {
  const url = `http://${gateway}:3000/v1/macid/list`

  const requestOptions: RequestInit = {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  }

  const response = await fetch(url, requestOptions)
  const { clients }: { clients: Record<string, string> } = await response.json()
  const mac = clients[wifiIp]
  if (!mac) {
    const count = Object.keys(clients).length
    throw new Error(`Could not find mac for ip\n${count}`)
  }
  return mac.replaceAll(':', '')
}

export const enableMac = async (gateway: string, mac: string) => {
  const url = `http://${gateway}:3000/v1/macid/affine/${mac}`

  const body = JSON.stringify({
    // endpoint: 'http://ec2-35-82-2-45.us-west-2.compute.amazonaws.com:50051',
    endpoint: 'http://35.82.2.45:50051',
  })

  const requestOptions: RequestInit = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  }

  const response = await fetch(url, requestOptions)

  return response.status === 200
}

export const getAccount = async (address: string): Promise<ScAccount> => {
  const response = await getScManager(`v1/account/${address}`)
  return camelcaseKeys(response)
}

export const submitBurnTxn = async (address: string, txn: string) => {
  const response = await postScManager(`v1/account/${address}/submit`, {
    txn,
  })
  return response.status === 200
}

export const authorize = async (
  address: string,
  opts: {
    macAddr: string
    accessPoint: string
    type: SessionType
    amount: number
  },
) => {
  const response = await postScManager(
    `v1/account/${address}/authorize`,
    snakecaseKeys(opts),
  )
  return response.status === 'ok'
}
