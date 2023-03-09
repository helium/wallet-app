import React, { memo, useEffect, useCallback, useMemo } from 'react'
import FlashMessage, {
  hideMessage,
  Icon,
  showMessage,
} from 'react-native-flash-message'
import { Linking } from 'react-native'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { useTranslation } from 'react-i18next'
import Close from '@assets/images/closeModal.svg'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { useColors, useHitSlop } from '@theme/themeHooks'
import useStatusPage from './useStatusPage'
import { HELIUM_STATUS_URL } from './statusPageTypes'
import shortLocale from '../../utils/formatDistance'

const onTapStatusBanner = async () => {
  await Linking.openURL(HELIUM_STATUS_URL)
}

const StatusBanner = () => {
  const { t } = useTranslation()
  const incidents = useStatusPage()
  const hitSlop = useHitSlop('m')
  const { primaryText } = useColors()

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

  useEffect(() => {
    if (!incidents.length) return

    const [lastIncident] = incidents

    showMessage({
      type: lastIncident.impact === 'critical' ? 'danger' : 'warning',
      message: lastIncident.name,
      description: getAlertDescription(lastIncident.updated_at),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incidents])

  const icon = useCallback(() => {
    return (
      <TouchableOpacityBox
        onPress={hideMessage}
        padding="s"
        hitSlop={hitSlop}
        alignItems="flex-end"
        flex={1}
      >
        <Close color={primaryText} width={30} height={30} />
      </TouchableOpacityBox>
    )
  }, [hitSlop, primaryText])

  const iconStyle = useMemo(
    () => ({ icon: 'danger', position: 'right' } as Icon),
    [],
  )

  return (
    <FlashMessage
      position="top"
      autoHide={false}
      floating
      icon={iconStyle}
      onPress={onTapStatusBanner}
      renderFlashMessageIcon={icon}
    />
  )
}

export default memo(StatusBanner)
