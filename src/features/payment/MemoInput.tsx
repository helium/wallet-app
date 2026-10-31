import { Input } from '@ui/Input'
import { Text } from '@ui/Text'
import React, { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

const MEMO_MAX_BYTES = 8

const encodeMemoString = (utf8Input: string | undefined) => {
  if (!utf8Input) return undefined
  const buff = Buffer.from(utf8Input, 'utf8')
  return buff.toString('base64')
}

const getMemoBytesLeft = (base64Memo?: string) => {
  if (!base64Memo)
    return { numBytes: MEMO_MAX_BYTES, valid: true, bytesUsed: 0 }
  const buff = Buffer.from(base64Memo, 'base64')
  const size = buff.byteLength
  return {
    bytesRemaining: MEMO_MAX_BYTES - size,
    valid: size <= MEMO_MAX_BYTES,
    bytesUsed: size,
  }
}

const useMemoValid = (txnMemo?: string) => {
  return useMemo(() => {
    const base64Memo = encodeMemoString(txnMemo)
    return getMemoBytesLeft(base64Memo)
  }, [txnMemo])
}

type Props = {
  onChangeText?: ((text: string) => void) | undefined
  value?: string | undefined
}
const MemoInput = ({ onChangeText, value }: Props) => {
  const { t } = useTranslation()
  const { bytesUsed, valid } = useMemoValid(value)

  return (
    <View className="flex-row items-center justify-center">
      <Input
        className="h-auto flex-1 border-0 bg-transparent px-4 py-3 shadow-none"
        placeholder={t('payment.enterMemo')}
        onChangeText={onChangeText}
        value={value}
        editable={!!onChangeText}
        returnKeyType="done"
      />
      <View className="absolute right-0 top-0">
        <Text
          size="xs"
          className={valid ? 'mr-4 text-foreground' : 'mr-4 text-destructive'}
        >
          {t('payment.memoBytes', {
            used: bytesUsed,
            total: MEMO_MAX_BYTES,
          })}
        </Text>
      </View>
    </View>
  )
}
export default memo(MemoInput)
