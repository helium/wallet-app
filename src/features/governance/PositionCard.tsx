import BlurActionSheet from '@components/BlurActionSheet'
import Box from '@components/Box'
import ListItem from '@components/ListItem'
import Text from '@components/Text'
import TokenIcon from '@components/TokenIcon'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { useMint, useSolanaUnixNow } from '@helium/helium-react-hooks'
import { HNT_MINT, humanReadable, toNumber } from '@helium/spl-utils'
import {
  PositionWithMeta,
  calcLockupMultiplier,
  useClosePosition,
  useDelegatePosition,
  useExtendPosition,
  useFlipPositionLockupKind,
  useRegistrar,
  useSplitPosition,
  useTransferPosition,
  useUndelegatePosition,
} from '@helium/voter-stake-registry-hooks'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import { BoxProps } from '@shopify/restyle'
import { useGovernance } from '@storage/GovernanceProvider'
import { Theme } from '@theme/theme'
import {
  daysToSecs,
  getMinDurationFmt,
  getTimeLeftFromNowFmt,
  secsToDays,
} from '@utils/dateTools'
import BN from 'bn.js'
import React, { useCallback, useState } from 'react'
import useAlert from '@hooks/useAlert'
import { useWalletSign } from '../../solana/WalletSignProvider'
import LockTokensModal, { LockTokensModalFormValues } from './LockTokensModal'
import { WalletStandardMessageTypes } from '../../solana/walletSignBottomSheetTypes'

interface IPositionCardProps extends Omit<BoxProps<Theme>, 'position'> {
  position: PositionWithMeta
}

export const PositionCard = ({ position, ...boxProps }: IPositionCardProps) => {
  const unixNow = useSolanaUnixNow(500000) || 0
  const { showOKAlert } = useAlert()
  const { walletSignBottomSheetRef } = useWalletSign()
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false)
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false)
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false)
  const [isDelegateModalOpen, setIsDelegateModalOpen] = useState(false)
  const { loading: isLoading, positions, refetch, mint } = useGovernance()
  const [actionsOpen, setActionsOpen] = useState(false)

  const { lockup, hasGenesisMultiplier, votingMint } = position
  const { symbol, json } = useMetaplexMetadata(votingMint.mint)
  const lockupKind = Object.keys(lockup.kind)[0] as string
  const isConstant = lockupKind === 'constant'
  const lockupExpired =
    !isConstant && lockup.endTs.sub(new BN(unixNow || 0)).lt(new BN(0))
  const { info: mintAcc } = useMint(votingMint.mint)

  const lockedTokens =
    mintAcc && humanReadable(position.amountDepositedNative, mintAcc.decimals)

  const maxActionableAmount = mintAcc
    ? toNumber(position.amountDepositedNative, mintAcc)
    : 0
  const canDelegate = votingMint.mint.equals(HNT_MINT)

  const { info: registrar = null } = useRegistrar(position.registrar)

  const getDecision = async (header: string) => {
    let decision

    if (walletSignBottomSheetRef) {
      decision = await walletSignBottomSheetRef.show({
        type: WalletStandardMessageTypes.signTransaction,
        url: '',
        header,
        serializedTxs: undefined,
      })
    }

    return decision
  }
  const handleCalcLockupMultiplier = useCallback(
    (lockupPeriodInDays: number) =>
      calcLockupMultiplier({
        lockupSecs: daysToSecs(lockupPeriodInDays),
        mint: votingMint.mint,
        registrar,
      }),
    [votingMint.mint, registrar],
  )

  const actions = useCallback(() => {
    return (
      <>
        <ListItem
          key="split"
          title="Split"
          onPress={() => {
            if (hasActiveVotes) {
              showOKAlert({
                title: 'Unable to split',
                message: 'Position is partaking in an active vote!',
              })
            } else {
              setIsSplitModalOpen(true)
            }
            setActionsOpen(false)
          }}
          selected={false}
          hasPressedState={false}
        />
        <ListItem
          key="transfer"
          title="Transfer"
          onPress={() => {
            if (hasActiveVotes) {
              showOKAlert({
                title: 'Unable to transfer',
                message: 'Position is partaking in an active vote!',
              })
            } else {
              setIsTransferModalOpen(true)
            }
            setActionsOpen(false)
          }}
          selected={false}
          hasPressedState={false}
        />
        <ListItem
          key="extend"
          title="Extend"
          onPress={() => {
            setIsExtendModalOpen(true)
            setActionsOpen(false)
          }}
          selected={false}
          hasPressedState={false}
        />
      </>
    )
  }, [])

  const refetchState = async () => {
    refetch()
  }

  const {
    loading: isExtending,
    error: extendingError,
    extendPosition,
  } = useExtendPosition()

  const {
    loading: isSpliting,
    error: splitingError,
    splitPosition,
  } = useSplitPosition()

  const {
    loading: isFlipping,
    error: flippingError,
    flipPositionLockupKind,
  } = useFlipPositionLockupKind()

  const {
    loading: isTransfering,
    error: transferingError,
    transferPosition,
  } = useTransferPosition()

  const {
    loading: isClosing,
    error: closingError,
    closePosition,
  } = useClosePosition()

  const {
    loading: isDelegating,
    error: delegatingError,
    delegatePosition,
  } = useDelegatePosition()

  const {
    loading: isUndelegating,
    error: undelegatingError,
    undelegatePosition,
  } = useUndelegatePosition()

  const handleExtendTokens = async (values: LockTokensModalFormValues) => {
    const decision = await getDecision('Extend Position')

    if (decision) {
      await extendPosition({
        position,
        lockupPeriodsInDays: values.lockupPeriodInDays,
      })

      if (!extendingError) {
        await refetchState()
      }
    }
  }

  const handleSplitTokens = async (values: LockTokensModalFormValues) => {
    const decision = await getDecision('Split Position')

    if (decision) {
      await splitPosition({
        sourcePosition: position,
        amount: values.amount,
        lockupKind: values.lockupKind.value,
        lockupPeriodsInDays: values.lockupPeriodInDays,
      })

      if (!splitingError) {
        await refetchState()
      }
    }
  }

  const lockupKindDisplay = isConstant ? 'Constant' : 'Decaying'
  const hasActiveVotes = position.numActiveVotes > 0

  if (isLoading)
    return (
      <Box
        backgroundColor="secondaryBackground"
        borderRadius="l"
        padding="xxl"
        {...boxProps}
      />
    )

  return (
    <>
      <TouchableOpacityBox
        backgroundColor="secondaryBackground"
        borderRadius="l"
        onPress={() => setActionsOpen(true)}
        {...boxProps}
      >
        <Box paddingHorizontal="m" paddingVertical="ms">
          <Box
            flexDirection="row"
            justifyContent="space-between"
            marginBottom="m"
          >
            <Box flexDirection="row" alignItems="center">
              {json?.image ? (
                <TokenIcon size={26} img={json.image} />
              ) : undefined}
              <Text variant="subtitle3" color="primaryText" marginLeft="m">
                {`${lockedTokens} ${symbol}`}
              </Text>
            </Box>
            {hasGenesisMultiplier && (
              <Box
                padding="s"
                paddingHorizontal="m"
                backgroundColor="blueBright500"
                borderRadius="m"
              >
                <Text variant="body3" fontSize={10} color="black">
                  LANDRUSH
                </Text>
              </Box>
            )}
          </Box>
          <Box
            flexDirection="row"
            justifyContent="space-between"
            paddingBottom="s"
          >
            <Box>
              <Text variant="body2" color="secondaryText">
                Lockup Type
              </Text>
              <Text variant="body2" color="primaryText">
                {lockupKindDisplay}
              </Text>
            </Box>
            <Box>
              <Text variant="body2" color="secondaryText" textAlign="right">
                Vote Multiplier
              </Text>
              <Text variant="body2" color="primaryText" textAlign="right">
                {(
                  (position.votingPower.isZero()
                    ? 0
                    : // Mul by 100 to get 2 decimal places
                      position.votingPower
                        .mul(new BN(100))
                        .div(position.amountDepositedNative)
                        .toNumber() / 100) /
                  (position.genesisEnd.gt(new BN(unixNow || 0))
                    ? votingMint.genesisVotePowerMultiplier
                    : 1)
                ).toFixed(2)}
              </Text>
            </Box>
          </Box>
          <Box
            flexDirection="row"
            justifyContent="space-between"
            paddingBottom="s"
          >
            <Box>
              <Text variant="body2" color="secondaryText">
                {isConstant ? 'Min Duration' : 'Time left'}
              </Text>
              <Text variant="body2" color="primaryText">
                {isConstant
                  ? getMinDurationFmt(
                      position.lockup.startTs,
                      position.lockup.endTs,
                    )
                  : getTimeLeftFromNowFmt(position.lockup.endTs)}
              </Text>
            </Box>
            {hasGenesisMultiplier && (
              <Box>
                <Text variant="body2" color="secondaryText" textAlign="right">
                  Landrush
                </Text>
                <Text variant="body2" color="primaryText" textAlign="right">
                  {votingMint.genesisVotePowerMultiplier}x ($
                  {getTimeLeftFromNowFmt(position.genesisEnd)}
                </Text>
              </Box>
            )}
          </Box>
        </Box>
      </TouchableOpacityBox>
      <BlurActionSheet
        title="Position Actions"
        open={actionsOpen}
        onClose={() => setActionsOpen(false)}
      >
        {actions()}
      </BlurActionSheet>
      {isExtendModalOpen && (
        <LockTokensModal
          mint={mint}
          mode="extend"
          minLockupTimeInDays={
            isConstant
              ? Math.ceil(
                  secsToDays(
                    position.lockup.endTs
                      .sub(position.lockup.startTs)
                      .toNumber(),
                  ),
                )
              : Math.ceil(
                  secsToDays(
                    position.lockup.endTs.sub(new BN(unixNow)).toNumber(),
                  ),
                )
          }
          maxLockupTimeInDays={secsToDays(
            votingMint.lockupSaturationSecs.toNumber(),
          )}
          maxLockupAmount={maxActionableAmount}
          calcMultiplierFn={handleCalcLockupMultiplier}
          onClose={() => setIsExtendModalOpen(false)}
          onSubmit={handleExtendTokens}
        />
      )}
      {isSplitModalOpen && (
        <LockTokensModal
          mint={mint}
          mode="split"
          minLockupTimeInDays={
            isConstant
              ? Math.ceil(
                  secsToDays(
                    position.lockup.endTs
                      .sub(position.lockup.startTs)
                      .toNumber(),
                  ),
                )
              : Math.ceil(
                  secsToDays(
                    position.lockup.endTs.sub(new BN(unixNow)).toNumber(),
                  ),
                )
          }
          maxLockupTimeInDays={secsToDays(
            votingMint.lockupSaturationSecs.toNumber(),
          )}
          maxLockupAmount={maxActionableAmount}
          calcMultiplierFn={handleCalcLockupMultiplier}
          onClose={() => setIsSplitModalOpen(false)}
          onSubmit={handleSplitTokens}
        />
      )}
      {/*       {isTransferModalOpen && (
        <TransferTokensModal
          mint={mint}
          isOpen={isTransferModalOpen}
          positions={transferablePositions}
          maxTransferAmount={maxActionableAmount}
          onClose={() => setIsTransferModalOpen(false)}
          onSubmit={handleTransferTokens}
        />
      )} */}
    </>
  )
}
