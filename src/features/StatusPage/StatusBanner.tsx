import React, { memo, useEffect, useCallback, useEffectEvent } from 'react'
import Toast, {
  ToastConfig,
  ToastConfigParams,
} from 'react-native-toast-message'
import { Linking, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { PressableScale } from '@ui/PressableScale'
import { Text } from '@ui/Text'
import { twMerge } from '@ui/twMerge'
import { X } from 'lucide-react-native'
import { withUniwind } from 'uniwind'
import useStatusPage from './useStatusPage'
import { HELIUM_STATUS_URL, Incident } from './statusPageTypes'
import shortLocale from '../../utils/formatDistance'

const onTapStatusBanner = async () => {
  Toast.hide()
  await Linking.openURL(HELIUM_STATUS_URL)
}

const hideBanner = () => Toast.hide()

const CloseIcon = withUniwind(X)

const HIT_SLOP = { top: 16, bottom: 16, left: 16, right: 16 }

const IncidentToast = ({
  type,
  text1,
  text2,
  onPress,
}: ToastConfigParams<unknown>) => {
  return (
    <PressableScale
      feedback="opacity"
      onPress={onPress}
      className={twMerge(
        'mx-3 flex-row rounded-md py-4 pl-5',
        type === 'danger' ? 'bg-destructive' : 'bg-warning-500',
      )}
    >
      <View className="flex-1">
        <Text size="lg" className="mb-1 font-semibold text-white">
          {text1}
        </Text>
        <Text size="sm" className="text-white">
          {text2}
        </Text>
      </View>
      <PressableScale
        feedback="opacity"
        onPress={hideBanner}
        hitSlop={HIT_SLOP}
        className="items-end p-2"
      >
        <CloseIcon size={24} colorClassName="accent-white" />
      </PressableScale>
    </PressableScale>
  )
}

const toastConfig: ToastConfig = {
  danger: IncidentToast,
  warning: IncidentToast,
}

const StatusBanner = () => {
  const { t } = useTranslation()
  const { top } = useSafeAreaInsets()
  const incidents = useStatusPage()

  const getAlertDescription = useCallback(
    (timestamp: string) => {
      return t('statusBanner.description', {
        date: formatDistanceToNow(parseISO(timestamp), {
          locale: shortLocale,
          addSuffix: true,
        }),
      })
    },
    [t],
  )

  const showIncident = useEffectEvent((lastIncident: Incident) => {
    Toast.show({
      type: lastIncident.impact === 'critical' ? 'danger' : 'warning',
      text1: lastIncident.name,
      text2: getAlertDescription(lastIncident.updated_at),
      position: 'top',
      autoHide: false,
      onPress: () => void onTapStatusBanner().catch(console.error),
    })
  })

  useEffect(() => {
    if (!incidents.length) return

    const [lastIncident] = incidents

    showIncident(lastIncident)
  }, [incidents])

  return <Toast config={toastConfig} topOffset={top + 10} />
}

export default memo(StatusBanner)
