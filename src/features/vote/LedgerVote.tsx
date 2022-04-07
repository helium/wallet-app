import React, {
  forwardRef,
  memo,
  ReactNode,
  Ref,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import { BottomSheetBackdrop, BottomSheetModal } from '@gorhom/bottom-sheet'
import { useTranslation } from 'react-i18next'
import { Edge } from 'react-native-safe-area-context'
import { TokenBurnV1 } from '@helium/transactions'
import Ledger from '@assets/images/ledger.svg'
import { useColors, useOpacity } from '../../theme/themeHooks'
import { signLedgerBurn, useLedger } from '../../utils/heliumLedger'
import { LedgerDevice } from '../../storage/cloudStorage'
import HandleBasic from '../../components/HandleBasic'
import SafeAreaBox from '../../components/SafeAreaBox'
import Box from '../../components/Box'
import Text from '../../components/Text'
import * as Logger from '../../utils/logger'

type ShowOptions = {
  ledgerDevice: LedgerDevice
  unsignedTxn: TokenBurnV1
  txnJson: string
}

export type LedgerVoteRef = {
  show: (opts: ShowOptions) => void
  hide: () => void
}

type Props = {
  children: ReactNode
  onConfirm: (opts: { txn: TokenBurnV1; txnJson: string }) => void
  onError: (error: Error) => void
}
const LedgerVote = forwardRef(
  ({ children, onConfirm, onError }: Props, ref: Ref<LedgerVoteRef>) => {
    useImperativeHandle(ref, () => ({ show, hide }))
    const { t } = useTranslation()
    const bottomSheetModalRef = useRef<BottomSheetModal>(null)
    const { backgroundStyle } = useOpacity('surfaceSecondary', 1)
    const { primaryText } = useColors()
    const [options, setOptions] = useState<ShowOptions>()
    const { getTransport } = useLedger()
    const snapPoints = useMemo(() => {
      return [600]
    }, [])

    const show = useCallback(
      async (opts: ShowOptions) => {
        setOptions(opts)
        bottomSheetModalRef.current?.present()
        try {
          const nextTransport = await getTransport(opts.ledgerDevice.id)
          const payment = await signLedgerBurn(nextTransport, opts.unsignedTxn)
          onConfirm({ txn: payment, txnJson: opts.txnJson })
          bottomSheetModalRef.current?.dismiss()
        } catch (error) {
          // in this case, user is likely not on Helium app
          Logger.error(error)
          onError(error as Error)
          bottomSheetModalRef.current?.dismiss()
        }
      },
      [getTransport, onConfirm, onError],
    )

    const hide = useCallback(() => {
      bottomSheetModalRef.current?.dismiss()
    }, [])

    const renderBackdrop = useCallback(
      (props) => (
        <BottomSheetBackdrop
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...props}
        />
      ),
      [],
    )

    const renderHandle = useCallback(() => {
      return <HandleBasic marginTop="s" marginBottom="m" />
    }, [])

    const safeEdges = useMemo(() => ['bottom'] as Edge[], [])

    return (
      <>
        <BottomSheetModal
          ref={bottomSheetModalRef}
          index={0}
          backgroundStyle={backgroundStyle}
          backdropComponent={renderBackdrop}
          handleComponent={renderHandle}
          snapPoints={snapPoints}
        >
          <SafeAreaBox
            flex={1}
            edges={safeEdges}
            paddingHorizontal="l"
            flexDirection="column"
            alignItems="center"
          >
            <Box marginBottom="xl">
              <Ledger width={100} height={100} color={primaryText} />
            </Box>
            <Text variant="h1" marginBottom="l">
              {t('vote.ledger.title')}
            </Text>
            <Text variant="subtitle1" color="secondaryText">
              {t('vote.ledger.subtitle', {
                name: options?.ledgerDevice.name,
              })}
            </Text>
          </SafeAreaBox>
        </BottomSheetModal>
        {children}
      </>
    )
  },
)

export default memo(LedgerVote)
