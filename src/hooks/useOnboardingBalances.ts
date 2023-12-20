import { rewardableEntityConfigKey } from '@helium/helium-entity-manager-sdk'
import { useOwnedAmount, useSolOwnedAmount } from '@helium/helium-react-hooks'
import { subDaoKey } from '@helium/helium-sub-daos-sdk'
import { Maker } from '@helium/onboarding'
import { useOnboarding } from '@helium/react-native-sdk'
import {
  DC_MINT,
  HNT_MINT,
  IOT_MINT,
  MOBILE_MINT,
  heliumAddressToSolAddress,
} from '@helium/spl-utils'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import { usePublicKey } from '@hooks/usePublicKey'
import { useSubDao } from '@hooks/useSubDao'
import { useBalance } from '@utils/Balance'
import { IOT_SUB_DAO_KEY } from '@utils/constants'
import BN from 'bn.js'
import { useMemo } from 'react'
import { useAsync } from 'react-async-hook'
import { useRewardableEntityConfig } from './useRewardableEntityConfig'
import { useIotInfo } from './useIotInfo'

function useBN(bigint?: bigint) {
  return useMemo(
    () => (bigint ? new BN(bigint.toString()) : undefined),
    [bigint],
  )
}

const IOT_REWARDABLE_ENTITY_CONFIG = rewardableEntityConfigKey(
  subDaoKey(IOT_MINT)[0],
  'IOT',
)[0]

const MOBILE_REWARDABLE_ENTITY_CONFIG = rewardableEntityConfigKey(
  subDaoKey(MOBILE_MINT)[0],
  'MOBILE',
)[0]

export function useOnboardingBalnces(hotspotAddress: string | undefined): {
  maker?: Maker
  loadingMaker: boolean
  makerDc?: BN
  loadingMakerDc: boolean
  makerSol?: BN
  loadingMakerSol: boolean
  mySol?: BN
  loadingMySol: boolean
  myDc?: BN
  loadingMyDc: boolean
  myHnt?: BN
  loadingMyHnt: boolean
  myDcWithHnt?: BN
  // Onboarding by subdao mint
  onboardingDcRequirements: Record<string, BN>
  loadingOnboardingDcRequirements: boolean
  // Location assert by subdao mint
  locationAssertDcRequirements: Record<string, BN>
  loadingLocationAssertDcRequirements: boolean
  error?: Error
} {
  const { getOnboardingRecord } = useOnboarding()
  const {
    result: onboardingRecord,
    error: fetchRecordError,
    loading: loadingMaker,
  } = useAsync(async () => {
    if (hotspotAddress) {
      return getOnboardingRecord(hotspotAddress)
    }
  }, [getOnboardingRecord, hotspotAddress])
  const maker = onboardingRecord?.maker
  const makerSolAddr = useMemo(
    () => maker && heliumAddressToSolAddress(maker.address),
    [maker],
  )

  const { amount: makerDc, loading: loadingMakerDc } = useOwnedAmount(
    usePublicKey(makerSolAddr),
    DC_MINT,
  )
  const wallet = useCurrentWallet()
  const { amount: myDc, loading: loadingMyDc } = useOwnedAmount(wallet, DC_MINT)
  const { amount: myHnt, loading: loadingMyHnt } = useOwnedAmount(
    wallet,
    HNT_MINT,
  )
  const { networkTokensToDc } = useBalance()
  const myDcWithHnt =
    !loadingMyDc && !loadingMyHnt
      ? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        new BN(myDc?.toString() || '0').add(
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          networkTokensToDc(new BN(myHnt?.toString() || '0'))!.div(
            new BN(100000000),
          ),
        )
      : undefined
  const { info: iotSubDao, loading: loadingSubDao } = useSubDao(
    IOT_SUB_DAO_KEY.toBase58(),
    true,
  )
  const { info: iotREC, loading: loadingIotREC } = useRewardableEntityConfig(
    IOT_REWARDABLE_ENTITY_CONFIG.toBase58(),
  )
  const { info: mobileREC, loading: loadingMobileREC } =
    useRewardableEntityConfig(MOBILE_REWARDABLE_ENTITY_CONFIG.toBase58())
  const deviceType = lowercaseFirstLetter(
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    onboardingRecord?.deviceType || 'Cbrs',
  )
  const mobileSetting = useMemo(
    () =>
      (
        mobileREC?.settings.mobileConfigV1 || mobileREC?.settings.mobileConfigV2
      )?.feesByDevice.find(
        (fee: any) => Object.keys(fee.deviceType)[0] === deviceType,
      ),
    [mobileREC, deviceType],
  )
  const mobileOnboardFee = mobileSetting?.dcOnboardingFee
  const mobileAssertFee = mobileSetting?.locationStakingFee
  const iotOnboardFee = iotSubDao?.onboardingDcFee
  const { info: iotInfo, loading: loadingIotInfo } = useIotInfo(hotspotAddress)
  const iotAssertFee = useMemo(
    () =>
      iotInfo?.isFullHotspot
        ? iotREC?.settings.iotConfig.fullLocationStakingFee
        : iotREC?.settings.iotConfig.dataonlyLocationStakingFee,
    [iotInfo, iotREC],
  )
  const loadingOnboardingDcRequirements = loadingMobileREC || loadingSubDao
  const loadingLocationAssertDcRequirements =
    loadingIotREC || loadingMobileREC || loadingIotInfo
  const onboardingDcRequirements = useMemo(() => {
    return {
      [IOT_MINT.toBase58()]: iotOnboardFee,
      [MOBILE_MINT.toBase58()]: mobileOnboardFee,
    }
  }, [mobileOnboardFee, iotOnboardFee])
  const locationAssertDcRequirements = useMemo(() => {
    return {
      [IOT_MINT.toBase58()]: iotAssertFee,
      [MOBILE_MINT.toBase58()]: mobileAssertFee,
    }
  }, [mobileAssertFee, iotAssertFee])

  const { amount: makerSol, loading: loadingMakerSol } = useSolOwnedAmount(
    usePublicKey(makerSolAddr),
  )
  const { amount: mySol, loading: loadingMySol } = useSolOwnedAmount(
    usePublicKey(makerSolAddr),
  )

  return {
    maker,
    loadingMaker,
    makerDc: useBN(makerDc),
    loadingMakerDc: loadingMaker || loadingMakerDc,
    makerSol: useBN(makerSol),
    loadingMakerSol: loadingMaker || loadingMakerSol,
    mySol: useBN(mySol),
    loadingMySol,
    myDc: useBN(myDc),
    loadingMyDc,
    myHnt: useBN(myHnt),
    loadingMyHnt,
    myDcWithHnt,
    onboardingDcRequirements,
    loadingOnboardingDcRequirements,
    locationAssertDcRequirements,
    loadingLocationAssertDcRequirements,
    error: fetchRecordError,
  }
}

function lowercaseFirstLetter(str: string) {
  return str.charAt(0).toLowerCase() + str.slice(1)
}
