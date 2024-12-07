import Box from '@components/Box'
import React, { useCallback, useMemo } from 'react'
import Text from '@components/Text'
import ImageBox from '@components/ImageBox'
import { useTranslation } from 'react-i18next'
import { Select } from '@components/Select'
import CheckButton from '../../../components/CheckButton'
import { useHotspotOnboarding } from '../OnboardingSheet'

export const SelectFloorScreen = () => {
  const { t } = useTranslation()
  const {
    setOnboardDetails,
    carouselRef,
    onboardDetails: { height },
  } = useHotspotOnboarding()

  const floors = useMemo(() => {
    return Array.from({ length: 200 }, (_, i) => ({
      label: t('SelectFloorScreen.floor', { floor: i + 1 }),
      value: (i + 1) * 5,
      subLabel: t('SelectFloorScreen.approx', { meters: (i + 1) * 5 }),
    }))
  }, [t])

  const onValueChange = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (value: any) => {
      setOnboardDetails((o) => ({
        ...o,
        height: value,
      }))
      carouselRef?.current?.snapToNext()
    },
    [setOnboardDetails, carouselRef],
  )

  const onNext = useCallback(() => {
    carouselRef?.current?.snapToNext()
  }, [carouselRef])

  return (
    <Box justifyContent="center" alignItems="center" flex={1} padding="2xl">
      <ImageBox
        source={require('@assets/images/building.png')}
        marginBottom="2xl"
      />
      <Text variant="displayMdSemibold" color="primaryText" marginBottom="2.5">
        {t('SelectFloorScreen.title')}
      </Text>
      <Text
        variant="textLgRegular"
        color="text.quaternary-500"
        textAlign="center"
      >
        {t('SelectFloorScreen.subtitle')}
      </Text>
      <Select
        hasSearch
        marginTop="2xl"
        initialValue={height}
        onValueChange={onValueChange}
        options={floors}
        placeholder={t('SelectFloorScreen.selectPlaceholder')}
      />
      {height ? <CheckButton onPress={onNext} /> : null}
    </Box>
  )
}

export default SelectFloorScreen
