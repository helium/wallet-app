import { getKeypair } from '../storage/secureStorage'

const makeSignature = async (token: { address: string; time: number }) => {
  const stringifiedToken = JSON.stringify(token)
  const keypair = await getKeypair(token.address)
  if (!keypair) return
  const signature = await keypair.sign(stringifiedToken)

  return Buffer.from(signature).toString('base64')
}

const makeApiToken = async (address?: string) => {
  if (!address) return ''

  const time = Math.floor(Date.now() / 1000)

  const token = {
    address,
    time,
  }

  const signature = await makeSignature(token)

  if (!signature) return ''

  const signedToken = { ...token, signature }
  return Buffer.from(JSON.stringify(signedToken)).toString('base64')
}

export default makeApiToken
