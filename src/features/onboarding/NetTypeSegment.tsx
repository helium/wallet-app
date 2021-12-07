/* eslint-disable react/jsx-props-no-spreading */
import { BoxProps } from '@shopify/restyle'
import * as React from 'react'
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { NetType } from '@helium/crypto-react-native'
import SegmentedControl from '../../components/SegmentedControl'
import { Spacing, Theme } from '../../theme/theme'

type Props = BoxProps<Theme> & {
  netType: number
  onSegmentChange: (netType: number) => void
  padding?: Spacing
}
const NetTypeSegment = ({
  netType,
  onSegmentChange,
  padding = 'l',
  ...boxProps
}: Props) => {
  const { t } = useTranslation()

  const segmentData = useMemo(
    () => [
      { id: NetType.MAINNET.toString(), title: t('onboarding.mainnet') },
      { id: NetType.TESTNET.toString(), title: t('onboarding.testnet') },
    ],
    [t],
  )

  const onChange = useCallback(
    (id: string) => {
      onSegmentChange(parseInt(id, 10))
    },
    [onSegmentChange],
  )
  return (
    <SegmentedControl
      {...boxProps}
      onChange={onChange}
      selectedId={netType.toString()}
      values={segmentData}
      padding={padding}
    />
  )
}

export default NetTypeSegment
