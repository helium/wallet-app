/* eslint-disable react/jsx-props-no-spreading */
import { useNavigation } from '@react-navigation/native'
import { BoxProps } from '@shopify/restyle'
import * as React from 'react'
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import SegmentedControl from '../../../components/SegmentedControl'
import { Spacing, Theme } from '../../../theme/theme'
import { MultiAccountNavigationProp } from './MultiAccountNavigator'

export type OnboardingOpt = 'import' | 'create' | 'ledger'
type Props = BoxProps<Theme> & {
  padding?: Spacing
  onboardingType: OnboardingOpt
  onSegmentChange: (id: OnboardingOpt) => void
}
const OnboardingSegment = ({
  onboardingType,
  onSegmentChange,
  padding,
  ...boxProps
}: Props) => {
  const { t } = useTranslation()
  const navigation = useNavigation<MultiAccountNavigationProp>()

  const segmentData = useMemo(() => {
    const data = [
      { id: 'import', title: t('onboarding.import') },
      { id: 'ledger', title: t('onboarding.ledger') },
      { id: 'create', title: t('onboarding.create') },
    ]
    return data
  }, [t])

  const handleSegmentChange = useCallback(
    (id: OnboardingOpt) => {
      switch (id) {
        case 'create':
          navigation.navigate('AccountCreateStart')
          break
        case 'import':
          navigation.navigate('AccountImportStartScreen')
          break
        case 'ledger':
          navigation.navigate('LedgerStart')
          break
      }

      onSegmentChange(id)
    },
    [navigation, onSegmentChange],
  )

  return (
    <SegmentedControl
      {...boxProps}
      padding={padding}
      onChange={handleSegmentChange as (id: string) => void}
      selectedId={onboardingType}
      values={segmentData}
    />
  )
}

export default OnboardingSegment
