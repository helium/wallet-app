import React, { memo, useEffect, useCallback, useEffectEvent } from 'react'
import Toast, {
  ToastConfig,
  ToastConfigParams,
} from 'react-native-toast-message'
import { Linking } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { useTranslation } from 'react-i18next'
import Close from '@assets/images/closeModal.svg'
import Box from '@components/Box'
import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { useColors, useHitSlop } from '@theme/themeHooks'
import useStatusPage from './useStatusPage'
import { HELIUM_STATUS_URL, Incident } from './statusPageTypes'
import shortLocale from '../../utils/formatDistance'

const onTapStatusBanner = async () => {
  Toast.hide()
  await Linking.openURL(HELIUM_STATUS_URL)
}

const hideBanner = () => Toast.hide()

const IncidentToast = ({
  type,
  text1,
  text2,
  onPress,
}: ToastConfigParams<unknown>) => {
  const hitSlop = useHitSlop('m')
  const { primaryText } = useColors()

  return (
    <TouchableOpacityBox
      onPress={onPress}
      flexDirection="row"
      marginHorizontal="ms"
      paddingVertical="m"
      paddingLeft="lm"
      borderRadius="m"
      backgroundColor={type === 'danger' ? 'error' : 'orange500'}
    >
      <Box flex={1}>
        <Text variant="subtitle1" color="white" marginBottom="xs">
          {text1}
        </Text>
        <Text variant="body2" color="white">
          {text2}
        </Text>
      </Box>
      <TouchableOpacityBox
        onPress={hideBanner}
        padding="s"
        hitSlop={hitSlop}
        alignItems="flex-end"
      >
        <Close color={primaryText} width={30} height={30} />
      </TouchableOpacityBox>
    </TouchableOpacityBox>
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
