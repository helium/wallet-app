import React, {
  BaseSyntheticEvent,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react'
import { Platform, processColor, ViewStyle } from 'react-native'
import { ChartSelectEvent, LineChart } from 'react-native-charts-wrapper'
import { ScrollView } from 'react-native-gesture-handler'
import FadeInOut from '@components/FadeInOut'
import { useColors, useSpacing } from '@theme/themeHooks'
import useHaptic from '@hooks/useHaptic'
import usePrevious from '@hooks/usePrevious'
import { AccountBalance } from '../../types/balance'

const CHART_HEIGHT = 140
type Props = {
  chartValues: Array<{ y: number; info: AccountBalance | undefined }>
  onHistorySelected: (accountBalance: AccountBalance) => void
  selectedBalance?: AccountBalance
}
const AccountBalanceChart = ({
  chartValues,
  onHistorySelected,
  selectedBalance,
}: Props) => {
  const { triggerImpact } = useHaptic()
  const { primaryBackground } = useColors()
  const spacing = useSpacing()

  const chartsRef = useRef<
    LineChart & {
      highlights: (
        next:
          | Array<{
              x: number
              dataSetIndex?: number | undefined
              dataIndex?: number | undefined
              y?: number | undefined
              stackIndex?: number | undefined
            }>
          | undefined,
      ) => void
    }
  >(null)

  const processedColors = useMemo(
    () => ({
      primaryBackground: processColor(primaryBackground),
      primaryText: processColor('#8C8C8C'),
    }),
    [primaryBackground],
  )

  const prevSelectedBalance = usePrevious(selectedBalance)

  const handleSelect = useCallback(
    (event: ChartSelectEvent | BaseSyntheticEvent) => {
      const coercedEvent = event?.nativeEvent as {
        data: { info: AccountBalance }
      }

      const info = coercedEvent?.data?.info
      onHistorySelected(info)

      if (info) {
        triggerImpact()
      }
    },
    [onHistorySelected, triggerImpact],
  )

  useEffect(() => {
    if (prevSelectedBalance && !selectedBalance && chartsRef?.current) {
      chartsRef.current.highlights([])
    }
  }, [prevSelectedBalance, selectedBalance])

  const style = useMemo((): ViewStyle => {
    return {
      justifyContent: 'center',
      height: CHART_HEIGHT,
    }
  }, [])

  return (
    <FadeInOut>
      <ScrollView contentContainerStyle={style} scrollEnabled={false}>
        <LineChart
          ref={chartsRef}
          style={{
            flex: 1,
            marginHorizontal: -spacing.s,
            borderWidth: 0,
            maxHeight: CHART_HEIGHT,
          }}
          onSelect={handleSelect}
          xAxis={{
            enabled: false,
            drawAxisLines: false,
            drawGridLines: false,
            drawLabels: false,
          }}
          drawBorders={false}
          borderColor={processedColors.primaryBackground}
          chartDescription={{ text: '' }}
          borderWidth={0}
          yAxis={{
            left: {
              enabled: false,
              drawGridLines: false,
              zeroLine: { enabled: false },
            },
            right: {
              enabled: false,
              drawGridLines: false,
              zeroLine: { enabled: false },
            },
          }}
          legend={{ enabled: false }}
          pinchZoom={false}
          chartBackgroundColor={processedColors.primaryBackground}
          scaleEnabled={false}
          scaleXEnabled={false}
          scaleYEnabled={false}
          data={{
            dataSets: [
              {
                label: '',
                config: {
                  drawHorizontalHighlightIndicator: false,
                  highlightColor: processedColors.primaryText,
                  lineWidth: 1,
                  color: processedColors.primaryText,
                  drawCircles: false,
                  drawValues: false,
                  mode: 'CUBIC_BEZIER',
                  drawFilled: true,
                  fillAlpha: 100,
                  fillGradient: {
                    colors: [
                      Platform.OS === 'ios'
                        ? processedColors.primaryBackground
                        : processedColors.primaryText,
                      Platform.OS === 'ios'
                        ? processedColors.primaryText
                        : processedColors.primaryBackground,
                    ],
                    positions: [0, 1],
                    orientation: 'TOP_BOTTOM',
                  },
                },
                values: chartValues,
              },
            ],
          }}
        />
      </ScrollView>
    </FadeInOut>
  )
}

export default memo(AccountBalanceChart)
