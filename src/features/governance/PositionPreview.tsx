import Hnt from '@assets/images/hnt.svg'
import Iot from '@assets/images/iot.svg'
import Mobile from '@assets/images/mobile.svg'
import { EPOCH_LENGTH } from '@helium/helium-sub-daos-sdk'
import { PositionWithMeta } from '@helium/voter-stake-registry-hooks'
import { useGovernance } from '@storage/GovernanceProvider'
import { PressableScale, type PressableScaleProps } from '@ui/PressableScale'
import { Text } from '@ui/Text'
import { twMerge } from '@ui/twMerge'
import { getMinDurationFmt, getTimeLeftFromNowFmt } from '@utils/dateTools'
import { humanReadable } from '@utils/formatting'
import BN from 'bn.js'
import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { SvgProps } from 'react-native-svg'

const NetworkSvg: React.FC<{ network: string } & SvgProps> = ({
  network,
  ...props
}) => {
  switch (network) {
    case 'hnt':
      return <Hnt {...props} />
    case 'iot':
      return <Iot {...props} />
    case 'mobile':
      return <Mobile {...props} />
    default:
      return null
  }
}

type Props = {
  position: PositionWithMeta
}

export const PositionPreview: React.FC<
  Props & Omit<PressableScaleProps, 'children'>
> = ({ position, className, ...pressableProps }) => {
  const { t } = useTranslation()
  const { subDaos, network, mintAcc } = useGovernance()
  const { lockup, isDelegated, hasGenesisMultiplier, votingMint } = position
  const lockupKind = Object.keys(lockup.kind)[0] as string
  const isConstant = lockupKind === 'constant'

  const amount = humanReadable(
    position.amountDepositedNative,
    mintAcc?.decimals,
  )

  const subDao = useMemo(
    () =>
      subDaos?.find(
        (s) =>
          position.delegatedSubDao && s.pubkey.equals(position.delegatedSubDao),
      ),
    [subDaos, position.delegatedSubDao],
  )

  const Icon = <NetworkSvg width={32} height={32} network={network} />
  const delegatedNetwork = subDao?.dntMetadata.json?.symbol.toLowerCase()
  const DelegatedIcon = delegatedNetwork && (
    <NetworkSvg width={14} height={14} network={delegatedNetwork} />
  )

  return (
    <PressableScale
      {...pressableProps}
      className={twMerge(
        'mt-2 flex-row items-center rounded-[12px] bg-secondary p-4',
        className,
      )}
    >
      <View className="mr-2">{Icon}</View>
      <View className="flex-col justify-around">
        {hasGenesisMultiplier && (
          <View className="flex-row items-center gap-1">
            <Text size="xs" className="text-right">
              {t('gov.positions.landrush')}
            </Text>
            <Text size="xs" className="text-right">
              {votingMint.genesisVotePowerMultiplier}x (
              {getTimeLeftFromNowFmt(lockup.endTs)})
            </Text>
          </View>
        )}
        <View className="flex-row items-center">
          <Text size="xs" className="mr-0.5">
            {amount} {network.toUpperCase()}
          </Text>
          <Text size="xs" className="mr-0.5">
            for
          </Text>
          <Text size="xs" className="mr-0.5">
            {isConstant
              ? getMinDurationFmt(lockup.startTs, lockup.endTs)
              : isDelegated
                ? getTimeLeftFromNowFmt(lockup.endTs.add(new BN(EPOCH_LENGTH)))
                : getTimeLeftFromNowFmt(lockup.endTs)}
          </Text>
          <Text size="xs" className="mr-0.5">
            {isConstant ? 'decaying delayed' : 'decaying'}
          </Text>
        </View>
        {subDao && (
          <View className="flex-row items-center">
            <Text size="xs" className="mr-1 text-muted-foreground">
              and delegated to
            </Text>
            <View className="mr-1">{DelegatedIcon}</View>
            <Text size="xs">{subDao.dntMetadata.symbol}</Text>
          </View>
        )}
      </View>
    </PressableScale>
  )
}
