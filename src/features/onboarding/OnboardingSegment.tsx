/* eslint-disable react/jsx-props-no-spreading */
import { BoxProps } from '@shopify/restyle'
import * as React from 'react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import SegmentedControl from '../../components/SegmentedControl'
import { Theme } from '../../theme/theme'
import { OnboardingOpt } from './OnboardingProvider'

type Props = BoxProps<Theme> & {
  onboardingType: OnboardingOpt
  onSegmentChange: (id: OnboardingOpt) => void
}
const OnboardingSegment = ({
  onboardingType,
  onSegmentChange,
  ...boxProps
}: Props) => {
  const { t } = useTranslation()

  const segmentData = useMemo(
    () => [
      { id: 'import', title: t('onboarding.import') },
      { id: 'create', title: t('onboarding.create') },
    ],
    [t],
  )

  return (
    <SegmentedControl
      {...boxProps}
      onChange={onSegmentChange as (id: string) => void}
      selectedId={onboardingType}
      values={segmentData}
    />
  )
}

export default OnboardingSegment
