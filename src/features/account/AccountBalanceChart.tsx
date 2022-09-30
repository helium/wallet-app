import React, {
  BaseSyntheticEvent,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react'
import { Platform, processColor } from 'react-native'
import { ChartSelectEvent, LineChart } from 'react-native-charts-wrapper'
import FadeInOut from '../../components/FadeInOut'
import { AccountBalance } from '../../generated/graphql'
import globalStyles from '../../theme/globalStyles'
import { useColors } from '../../theme/themeHooks'
import useHaptic from '../../utils/useHaptic'
import usePrevious from '../../utils/usePrevious'

type Props = {
  chartValues: Array<{ y: number; info: AccountBalance }>
  onHistorySelected: (accountBalance: AccountBalance) => void
  selectedBalance?: AccountBalance
}
const AccountBalanceChart = ({
  chartValues,
  onHistorySelected,
  selectedBalance,
}: Props) => {
  const { triggerImpact } = useHaptic()
  const { primaryBackground, primaryText } = useColors()

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
      primaryText: processColor(primaryText),
    }),
    [primaryBackground, primaryText],
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

  return (
    <FadeInOut style={[globalStyles.container, { justifyContent: 'center' }]}>
      <LineChart
        ref={chartsRef}
        style={{
          flex: 1,
          marginHorizontal: 0,
          borderWidth: 0,
          maxHeight: 140,
        }}
        onSelect={handleSelect}
        onTouchStart={(x) => {
          if (Platform.OS === 'ios') {
            handleSelect(x)
          }
        }}
        onChange={(x) => {
          if (Platform.OS === 'ios') {
            handleSelect(x)
          }
        }}
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
    </FadeInOut>
  )
}

export default memo(AccountBalanceChart)
