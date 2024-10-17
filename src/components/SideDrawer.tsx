import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  FadeInLeft,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated'
import { ww } from '@utils/layout'
import TouchableOpacityBox from './TouchableOpacityBox'
import { Box, ReAnimatedBox, SafeAreaBox, Text } from '.'
import MenuButton from './MenuButton'

type SideDrawerProps = {
  isExpanded: boolean
  onRoute: (route: string) => void
  onClose: () => void
}

const SideDrawer = ({ isExpanded, onRoute, onClose }: SideDrawerProps) => {
  const { t } = useTranslation()

  const routes: { title: string; value: string }[] = useMemo(
    () =>
      Array.from(
        t('sideDrawer.routes', {
          returnObjects: true,
        }),
      ),
    [t],
  )

  const animatedStyles = useAnimatedStyle(() => {
    if (isExpanded) {
      return {
        opacity: withTiming(1),
      }
    }
    return {
      opacity: withTiming(0),
    }
  }, [isExpanded])

  const onRoutePressed = useCallback(
    (route: string) => () => {
      onRoute(route)
    },
    [onRoute],
  )

  return (
    <ReAnimatedBox
      style={[animatedStyles]}
      position="absolute"
      width={ww}
      left={0}
      top={0}
      right={0}
      bottom={0}
      backgroundColor="primaryBackground"
      zIndex={100}
      pointerEvents={isExpanded ? 'auto' : 'none'}
    >
      <SafeAreaBox paddingHorizontal="5" paddingTop="5">
        <Box marginBottom="20">
          <MenuButton onPress={onClose} isOpen={isExpanded} />
        </Box>
        <Box gap="4">
          {isExpanded &&
            routes.map((route: { title: string; value: string }, index) => {
              return (
                <ReAnimatedBox
                  entering={FadeInLeft.duration(250).delay(100 * index)}
                  key={route.title}
                >
                  <TouchableOpacityBox onPress={onRoutePressed(route.value)}>
                    <Text variant="displaySmSemibold" color="primaryText">
                      {route.title}
                    </Text>
                  </TouchableOpacityBox>
                </ReAnimatedBox>
              )
            })}
        </Box>
      </SafeAreaBox>
    </ReAnimatedBox>
  )
}

export default SideDrawer
