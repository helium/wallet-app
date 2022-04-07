import React, { memo, useCallback, useReducer } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList } from 'react-native-gesture-handler'
import { ActivityIndicator } from 'react-native'
import Box from '../../components/Box'
import Text from '../../components/Text'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import { useColors, useHitSlop } from '../../theme/themeHooks'
import animateTransition from '../../utils/animateTransition'

const FilterTypeKeys = [
  'all',
  'mining',
  'payment',
  'hotspotAndValidators',
  'burn',
  'pending',
] as const
export type FilterType = typeof FilterTypeKeys[number]

type ActivityFilter = {
  filter: FilterType
  visible: boolean
}

const initialState = {
  filter: 'all',
  visible: false,
} as ActivityFilter

type ToggleFilter = {
  type: 'toggle'
}

type ChangeFilter = {
  type: 'change'
  filter: FilterType
}

function layoutReducer(
  state: ActivityFilter,
  action: ToggleFilter | ChangeFilter,
) {
  switch (action.type) {
    case 'toggle': {
      return {
        ...state,
        visible: !state.visible,
      }
    }
    case 'change': {
      return { ...state, filter: action.filter }
    }
  }
}

export const useActivityFilter = () => {
  const [state, dispatch] = useReducer(layoutReducer, initialState)
  const toggle = useCallback(() => dispatch({ type: 'toggle' }), [dispatch])
  const change = useCallback(
    (filter: FilterType) => dispatch({ type: 'change', filter }),
    [dispatch],
  )
  return { ...state, toggle, change }
}

type Props = ActivityFilter & {
  toggle: () => void
  change: (filter: FilterType) => void
  activityLoading?: boolean
}
const AccountActivityFilter = ({
  visible,
  filter,
  toggle,
  change,
  activityLoading,
}: Props) => {
  const { t } = useTranslation()
  const hitSlop = useHitSlop('l')
  const { surfaceSecondaryText } = useColors()

  const handleToggle = useCallback(() => {
    animateTransition('AccountActivityFilter.visible')
    toggle()
  }, [toggle])

  const handleChange = useCallback(
    (item: FilterType) => () => {
      change(item)
    },
    [change],
  )

  const renderItem = useCallback(
    // eslint-disable-next-line react/no-unused-prop-types
    ({ index, item }: { index: number; item: FilterType }) => {
      const selected = item === filter
      const isFirst = index === 0
      const isLast = index === FilterTypeKeys.length - 1
      return (
        <Box flexDirection="row">
          <TouchableOpacityBox
            paddingVertical="ms"
            paddingHorizontal="m"
            borderRadius="round"
            marginStart={isFirst ? 'l' : 'xs'}
            marginEnd={isLast ? 'l' : 'xs'}
            hitSlop={hitSlop}
            onPress={handleChange(item)}
            backgroundColor={selected ? 'surfaceContrast' : 'surface'}
            justifyContent="center"
          >
            <Text
              variant="body2"
              lineHeight={14}
              color={selected ? 'surfaceContrastText' : 'surfaceText'}
              textAlign="center"
            >
              {t(`accountsScreen.filterTypes.${item}`)}
            </Text>
          </TouchableOpacityBox>
          {isFirst && (
            <Box
              width={1}
              height="100%"
              backgroundColor="surface"
              marginHorizontal="ms"
            />
          )}
        </Box>
      )
    },
    [filter, handleChange, hitSlop, t],
  )

  const keyExtractor = useCallback((item) => item, [])

  return (
    <Box borderBottomWidth={1}>
      <Box flexDirection="row" justifyContent="space-between" paddingBottom="m">
        <Box flexDirection="row">
          <Text
            variant="body2"
            color="surfaceSecondaryText"
            paddingLeft="l"
            paddingRight="m"
          >
            {t('accountsScreen.myTransactions')}
          </Text>
          <ActivityIndicator
            size="small"
            color={surfaceSecondaryText}
            animating={activityLoading}
          />
        </Box>

        <TouchableOpacityBox
          paddingHorizontal="l"
          hitSlop={hitSlop}
          onPress={handleToggle}
        >
          <Text
            variant="body2"
            color="primaryText"
            width="100%"
            textAlign="right"
          >
            {visible
              ? t('accountsScreen.hideFilters')
              : t('accountsScreen.showFilters')}
          </Text>
        </TouchableOpacityBox>
      </Box>
      {visible && (
        <Box marginBottom="lm" marginTop="xxs">
          <FlatList
            data={FilterTypeKeys}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            horizontal
            showsHorizontalScrollIndicator={false}
          />
        </Box>
      )}
    </Box>
  )
}

export default memo(AccountActivityFilter)
