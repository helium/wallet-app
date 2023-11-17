/* eslint-disable @typescript-eslint/no-shadow */
import BlurActionSheet from '@components/BlurActionSheet'
import Box from '@components/Box'
import CircleLoader from '@components/CircleLoader'
import ListItem from '@components/ListItem'
import Text from '@components/Text'
import TokenIcon from '@components/TokenIcon'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { useMint, useSolanaUnixNow } from '@helium/helium-react-hooks'
import { HNT_MINT, humanReadable, toNumber } from '@helium/spl-utils'
import {
  PositionWithMeta,
  SubDaoWithMeta,
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
import useAlert from '@hooks/useAlert'
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
import React, { useCallback, useMemo, useState } from 'react'
import { useWalletSign } from '../../solana/WalletSignProvider'
import { WalletStandardMessageTypes } from '../../solana/walletSignBottomSheetTypes'
import { DelegateTokensModal } from './DelegateTokensModal'
import LockTokensModal, { LockTokensModalFormValues } from './LockTokensModal'
import { TransferTokensModal } from './TransferTokensModal'

interface IPositionCardProps extends Omit<BoxProps<Theme>, 'position'> {
  subDaos?: SubDaoWithMeta[]
  position: PositionWithMeta
}

export const PositionCard = ({
  position,
  subDaos,
  ...boxProps
}: IPositionCardProps) => {
  const unixNow = useSolanaUnixNow(60 * 5 * 1000) || 0
  const { showOKAlert } = useAlert()
  const { walletSignBottomSheetRef } = useWalletSign()
  const [actionsOpen, setActionsOpen] = useState(false)
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false)
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false)
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false)
  const [isDelegateModalOpen, setIsDelegateModalOpen] = useState(false)
  const { loading, positions, refetch, mint } = useGovernance()
  const transferablePositions: PositionWithMeta[] = useMemo(() => {
    if (!unixNow || !positions || !positions.length) {
      return []
    }

    const { lockup } = position
    const lockupKind = Object.keys(lockup.kind)[0]
    const positionLockupPeriodInDays = secsToDays(
      lockupKind === 'constant'
        ? lockup.endTs.sub(lockup.startTs).toNumber()
        : lockup.endTs.sub(new BN(unixNow || 0)).toNumber(),
    )

    return positions.filter((pos) => {
      const { lockup } = pos
      const lockupKind = Object.keys(lockup.kind)[0]
      const lockupPeriodInDays = secsToDays(
        lockupKind === 'constant'
          ? lockup.endTs.sub(lockup.startTs).toNumber()
          : lockup.endTs.sub(new BN(unixNow)).toNumber(),
      )

      return (
        (unixNow >= pos.genesisEnd.toNumber() ||
          unixNow <=
            position.votingMint.genesisVotePowerMultiplierExpirationTs.toNumber() ||
          !pos.hasGenesisMultiplier) &&
        !pos.isDelegated &&
        !position.pubkey.equals(pos.pubkey) &&
        lockupPeriodInDays >= positionLockupPeriodInDays
      )
    })
  }, [position, unixNow, positions])

  const { lockup, hasGenesisMultiplier, votingMint } = position
  const { info: mintAcc } = useMint(votingMint.mint)
  const { symbol, json } = useMetaplexMetadata(votingMint.mint)
  const lockupKind = Object.keys(lockup.kind)[0] as string
  const isConstant = lockupKind === 'constant'
  const lockupKindDisplay = isConstant ? 'Constant' : 'Decaying'
  const hasActiveVotes = position.numActiveVotes > 0
  const lockupExpired =
    !isConstant && lockup.endTs.sub(new BN(unixNow || 0)).lt(new BN(0))

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

  const handleClosePosition = async () => {
    const decision = await getDecision('Close Position')

    if (decision) {
      await closePosition({ position })

      if (!closingError) {
        await refetchState()
      }
    }
  }

  const handleFlipPositionLockupKind = async () => {
    const decision = await getDecision('Pause Unlock')

    if (decision) {
      await flipPositionLockupKind({ position })

      if (!flippingError) {
        await refetchState()
      }
    }
  }

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

  const handleTransferTokens = async (
    targetPosition: PositionWithMeta,
    amount: number,
  ) => {
    const decision = await getDecision('Transfer Position')

    if (decision) {
      await transferPosition({
        sourcePosition: position,
        amount,
        targetPosition,
      })

      if (!transferingError) {
        await refetchState()
      }
    }
  }

  const handleDelegateTokens = async (subDao: SubDaoWithMeta) => {
    const decision = await getDecision('Delegate Position')

    if (decision) {
      await delegatePosition({
        position,
        subDao,
      })

      if (!delegatingError) {
        await refetchState()
      }
    }
  }

  const handleUndelegateTokens = async () => {
    const decision = await getDecision('Undelegate Position')

    if (decision) {
      await undelegatePosition({ position })

      if (!undelegatingError) {
        await refetchState()
      }
    }
  }

  const actions = () => {
    return (
      <>
        {position.isDelegated ? (
          <ListItem
            key="undelegate"
            title="Undelgate"
            onPress={async () => {
              setActionsOpen(false)
              await handleUndelegateTokens()
            }}
            selected={false}
            hasPressedState={false}
          />
        ) : (
          <>
            {lockupExpired ? (
              <ListItem
                key="close"
                title="Close"
                onPress={async () => {
                  setActionsOpen(false)
                  if (hasActiveVotes) {
                    showOKAlert({
                      title: 'Unable to close',
                      message: 'Position is partaking in an active vote!',
                    })
                  } else {
                    await handleClosePosition()
                  }
                }}
                selected={false}
                hasPressedState={false}
              />
            ) : (
              <>
                <ListItem
                  key="split"
                  title="Split"
                  onPress={() => {
                    setActionsOpen(false)
                    if (hasActiveVotes) {
                      showOKAlert({
                        title: 'Unable to split',
                        message: 'Position is partaking in an active vote!',
                      })
                    } else {
                      setIsSplitModalOpen(true)
                    }
                  }}
                  selected={false}
                  hasPressedState={false}
                />
                <ListItem
                  key="transfer"
                  title="Transfer"
                  onPress={() => {
                    setActionsOpen(false)
                    if (hasActiveVotes) {
                      showOKAlert({
                        title: 'Unable to transfer',
                        message: 'Position is partaking in an active vote!',
                      })
                    } else {
                      setIsTransferModalOpen(true)
                    }
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
                {!isConstant && (
                  <ListItem
                    key="pause"
                    title="Pause Unlock"
                    onPress={async () => {
                      setActionsOpen(false)
                      if (hasActiveVotes) {
                        showOKAlert({
                          title: 'Unable to pause unlock',
                          message: 'Position is partaking in an active vote!',
                        })
                      } else {
                        await handleFlipPositionLockupKind()
                      }
                    }}
                    selected={false}
                    hasPressedState={false}
                  />
                )}
                {canDelegate && !position.isDelegated && (
                  <ListItem
                    key="delegate"
                    title="Delegate"
                    onPress={async () => {
                      setIsDelegateModalOpen(true)
                      setActionsOpen(false)
                    }}
                    selected={false}
                    hasPressedState={false}
                  />
                )}
              </>
            )}
          </>
        )}
      </>
    )
  }

  const delegatedSubDaoMetadata = position.delegatedSubDao
    ? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      subDaos?.find((sd) => sd.pubkey.equals(position.delegatedSubDao!))
        ?.dntMetadata
    : null

  const isSubmitting =
    loading ||
    isExtending ||
    isSpliting ||
    isClosing ||
    isTransfering ||
    isFlipping ||
    isDelegating ||
    isUndelegating

  if (isSubmitting) {
    return (
      <Box
        backgroundColor="secondaryBackground"
        borderRadius="l"
        padding="m"
        {...boxProps}
      >
        <Box flex={1} alignItems="center">
          <Box flex={1} marginBottom="ms">
            <CircleLoader color="white" />
          </Box>
          <Text variant="body2" color="primaryText">
            {isSpliting && 'Splitting...'}
            {isExtending && 'Extending...'}
            {isTransfering && 'Transferring...'}
            {isFlipping && 'Flipping...'}
            {isClosing && 'Closing...'}
            {isDelegating && 'Delegating...'}
            {isUndelegating && 'Undelegating...'}
          </Text>
        </Box>
      </Box>
    )
  }

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
          <Box flexDirection="row" justifyContent="space-between">
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
          {delegatedSubDaoMetadata && (
            <Box
              flexDirection="row"
              justifyContent="center"
              alignItems="center"
            >
              <Box borderColor="black" borderWidth={2} borderRadius="round">
                <TokenIcon
                  size={18}
                  img={delegatedSubDaoMetadata.json?.image || ''}
                />
              </Box>
              <Text variant="body2" color="primaryText" marginLeft="m">
                {delegatedSubDaoMetadata.name}
              </Text>
            </Box>
          )}
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
      {isTransferModalOpen && (
        <TransferTokensModal
          mint={mint}
          positions={transferablePositions}
          maxTransferAmount={maxActionableAmount}
          onClose={() => setIsTransferModalOpen(false)}
          onSubmit={handleTransferTokens}
        />
      )}
      {isDelegateModalOpen && (
        <DelegateTokensModal
          onClose={() => setIsDelegateModalOpen(false)}
          onSubmit={handleDelegateTokens}
        />
      )}
    </>
  )
}
