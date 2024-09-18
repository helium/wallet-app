import React, { useEffect, useMemo, useState } from 'react'
import QRCode from 'react-native-qrcode-svg'
import { UR, UREncoder } from '@ngraveio/bc-ur'
import Box from './Box'

const QR_CONTAINER_SIZE = 300
const MAX_FRAGMENT_CAPACITY = 200
export type StaticQrCodeProps = {
  size?: number
  ecl?: 'L' | 'M' | 'Q' | 'H'
  quietZone?: number
  data: string
}

const StaticQrCode = ({ size, data, ecl, quietZone }: StaticQrCodeProps) => {
  const qrCodeSize = size ?? QR_CONTAINER_SIZE
  const qrCodeQuietZone = quietZone ?? 20
  const qrCodeEcl = ecl ?? 'L'
  return (
    <Box flex={1} justifyContent="center" alignItems="center">
      <QRCode
        quietZone={qrCodeQuietZone}
        size={Math.max(0, qrCodeSize)}
        value={data}
        ecl={qrCodeEcl}
      />
    </Box>
  )
}

export type AnimatedQrCodeProps = {
  size?: number
  ecl?: 'L' | 'M' | 'Q' | 'H'
  quietZone?: number
  refreshSpeed?: number
  qrCodeType: string
  cborData: string
}
const AnimatedQrCode = ({
  size,
  cborData,
  ecl,
  quietZone,
  qrCodeType,
  refreshSpeed,
}: AnimatedQrCodeProps) => {
  const qrCodeSize = size ?? QR_CONTAINER_SIZE
  const qrCodeQuietZone = quietZone ?? 20
  const qrCodeEcl = ecl ?? 'L'
  const qrRefreshSpeed = refreshSpeed ?? 200
  const urEncoder = useMemo(() => {
    const ur = new UR(Buffer.from(cborData, 'hex'), qrCodeType)
    return new UREncoder(ur, MAX_FRAGMENT_CAPACITY)
  }, [cborData, qrCodeType])
  const firstUR = useMemo(() => urEncoder.nextPart(), [urEncoder])
  const [ur, setUR] = useState(firstUR)

  useEffect(() => {
    const interval = setInterval(() => {
      setUR(urEncoder.nextPart())
    }, qrRefreshSpeed)
    return () => clearInterval(interval)
  }, [urEncoder, qrRefreshSpeed])

  return (
    <StaticQrCode
      size={qrCodeSize}
      data={ur}
      ecl={qrCodeEcl}
      quietZone={qrCodeQuietZone}
    />
  )
}

export { StaticQrCode, AnimatedQrCode }
