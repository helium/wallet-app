import React, { FC, useCallback, useMemo } from 'react'
import { SvgProps } from 'react-native-svg'
import {
  BottomTabBarProps,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Color } from '@theme/theme'
import Box from '@components/Box'
import useEnrichedTransactions from '@hooks/useEnrichedTransactions'
import useHaptic from '@hooks/useHaptic'
import { useColors } from '@theme/themeHooks'
import ServiceNavBar from './ServiceNavBar'

const Tab = createBottomTabNavigator()

export type ServiceNavBarOption = {
  name: string
  component: React.FC
  Icon: FC<SvgProps>
  iconProps?: SvgProps
}

export type ServiceSheetProps = {
  options: ServiceNavBarOption[]
}

function CustomTabBar({
  state,
  navigation,
  options,
}: BottomTabBarProps & {
  options: ServiceNavBarOption[]
}) {
  const { hasNewTransactions, resetNewTransactions } = useEnrichedTransactions()
  const { triggerImpact } = useHaptic()
  const { bottom } = useSafeAreaInsets()

  const tabData = useMemo((): Array<{
    value: string
    Icon: FC<SvgProps>
    iconColor: Color
  }> => {
    return options.map((option) => {
      return {
        value: option.name,
        Icon: option.Icon,
        iconColor: 'primaryText',
        iconProps: option.iconProps,
      }
    })
  }, [options])

  const selectedValue = tabData[state.index].value

  const onPress = useCallback(
    (type: string) => {
      triggerImpact('light')
      const index = tabData.findIndex((item) => item.value === type)
      const isSelected = selectedValue === type
      const event = navigation.emit({
        type: 'tabPress',
        target: state.routes[index || 0].key,
        canPreventDefault: true,
      })

      // Check if activty tab is selected and has new transactions
      if (selectedValue === 'activity' && hasNewTransactions) {
        resetNewTransactions()
      }

      if (!isSelected && !event.defaultPrevented) {
        // The `merge: true` option makes sure that the params inside the tab screen are preserved
        navigation.navigate({
          name: state.routes[index || 0].name,
          merge: true,
          params: undefined,
        })
      }
    },
    [
      hasNewTransactions,
      navigation,
      resetNewTransactions,
      selectedValue,
      state.routes,
      tabData,
      triggerImpact,
    ],
  )

  const onLongPress = useCallback(
    (type: string) => {
      const index = tabData.findIndex((item) => item.value === type)

      navigation.emit({
        type: 'tabLongPress',
        target: state.routes[index || 0].key,
      })
    },
    [navigation, state.routes, tabData],
  )

  if (options?.length <= 1) {
    return null
  }

  return (
    <Box
      backgroundColor="transparent"
      position="absolute"
      bottom={0}
      left={0}
      right={0}
    >
      <Box
        style={{
          marginBottom: bottom,
        }}
      >
        <ServiceNavBar
          navBarOptions={tabData}
          selectedValue={selectedValue}
          onItemSelected={onPress}
          onItemLongPress={onLongPress}
        />
      </Box>
    </Box>
  )
}

const ServiceSheetPage = ({ options }: ServiceSheetProps) => {
  const colors = useColors()

  return (
    <Box height="100%" flexDirection="row" flex={1} zIndex={1}>
      <Tab.Navigator
        tabBar={(props: BottomTabBarProps) => (
          <CustomTabBar {...props} options={options} />
        )}
        screenOptions={{
          headerShown: false,
          lazy: true,
        }}
        sceneContainerStyle={{
          height: '100%',
          backgroundColor: colors.primaryBackground,
        }}
      >
        {options.map((option) => (
          <Tab.Screen
            key={option.name}
            name={option.name}
            component={option.component}
          />
        ))}
      </Tab.Navigator>
    </Box>
  )
}

const ServiceSheetPageWrapper = ({ options }: ServiceSheetProps) => {
  return <ServiceSheetPage options={options} />
}

export default ServiceSheetPageWrapper
