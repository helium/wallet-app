import React, { useCallback } from 'react'
import { BoxProps } from '@shopify/restyle'
import { Theme } from '@theme/theme'
import { LayoutChangeEvent } from 'react-native'
import ImageBox from './ImageBox'

const MakerHotspotImage = ({
  maker,
  deviceType,
  subDao,
  ...rest
}: {
  maker: string
  deviceType: string
  subDao: 'iot' | 'mobile'
} & BoxProps<Theme>) => {
  const Image = useCallback(
    ({
      deviceType: dType,
      subDao: dao,
      ...boxProps
    }: { deviceType: string; subDao: 'iot' | 'mobile' } & BoxProps<Theme>) => {
      switch (maker) {
        default:
        case 'Nova Labs':
          if (dType === 'cbrs') {
            return (
              <ImageBox
                source={require('@assets/images/ffiHotspot.png')}
                width={240}
                height={240}
                resizeMode="contain"
                marginTop="-xl"
                {...boxProps}
              />
            )
          }
          if (dao === 'iot') {
            return (
              <ImageBox
                source={require('@assets/images/ogHotspot.png')}
                width={240}
                height={240}
                resizeMode="contain"
                marginTop="-xl"
                {...boxProps}
              />
            )
          }
          return (
            <ImageBox
              source={require('@assets/images/indoorHotspotBig.png')}
              {...boxProps}
              marginTop="2"
            />
          )
        case 'Nebra Ltd':
          return (
            <ImageBox
              source={require('@assets/images/ogHotspot.png')}
              width={240}
              height={240}
              resizeMode="contain"
              marginTop="-xl"
              {...boxProps}
            />
          )
        case 'Maker Integration Tests':
          return (
            <ImageBox
              source={require('@assets/images/ogHotspot.png')}
              width={240}
              height={240}
              resizeMode="contain"
              marginTop="-xl"
              {...boxProps}
            />
          )
        case 'Smart Harvest':
          return (
            <ImageBox
              source={require('@assets/images/ogHotspot.png')}
              width={240}
              height={240}
              resizeMode="contain"
              marginTop="-xl"
              {...boxProps}
            />
          )
        case 'Osprey':
          return (
            <ImageBox
              source={require('@assets/images/ogHotspot.png')}
              width={240}
              height={240}
              resizeMode="contain"
              marginTop="-xl"
              {...boxProps}
            />
          )
        case 'COTX Networks':
          return (
            <ImageBox
              source={require('@assets/images/ogHotspot.png')}
              width={240}
              height={240}
              resizeMode="contain"
              marginTop="-xl"
              {...boxProps}
            />
          )
        case 'OPTION':
          return (
            <ImageBox
              source={require('@assets/images/ogHotspot.png')}
              width={240}
              height={240}
              resizeMode="contain"
              marginTop="-xl"
              {...boxProps}
            />
          )
        case 'Heltec Automation':
          return (
            <ImageBox
              source={require('@assets/images/ogHotspot.png')}
              width={240}
              height={240}
              resizeMode="contain"
              marginTop="-xl"
              {...boxProps}
            />
          )
        case 'Bobcat':
          return (
            <ImageBox
              source={require('@assets/images/ogHotspot.png')}
              width={240}
              height={240}
              resizeMode="contain"
              marginTop="-xl"
              {...boxProps}
            />
          )
        case 'Helium Inc':
          return (
            <ImageBox
              source={require('@assets/images/ogHotspot.png')}
              width={240}
              height={240}
              resizeMode="contain"
              marginTop="-xl"
              {...boxProps}
            />
          )
        case 'Dusun':
          return (
            <ImageBox
              source={require('@assets/images/ogHotspot.png')}
              width={240}
              height={240}
              resizeMode="contain"
              marginTop="-xl"
              {...boxProps}
            />
          )
        case 'RAKwireless':
          return (
            <ImageBox
              source={require('@assets/images/ogHotspot.png')}
              width={240}
              height={240}
              resizeMode="contain"
              marginTop="-xl"
              {...boxProps}
            />
          )
        case 'SONoC':
          return (
            <ImageBox
              source={require('@assets/images/ogHotspot.png')}
              width={240}
              height={240}
              resizeMode="contain"
              marginTop="-xl"
              {...boxProps}
            />
          )
        case 'Mimiq':
          return (
            <ImageBox
              source={require('@assets/images/ogHotspot.png')}
              width={240}
              height={240}
              resizeMode="contain"
              marginTop="-xl"
              {...boxProps}
            />
          )
        case 'DeWi Foundation':
          return (
            <ImageBox
              source={require('@assets/images/ogHotspot.png')}
              width={240}
              height={240}
              resizeMode="contain"
              marginTop="-xl"
              {...boxProps}
            />
          )
        case 'CalChip Connect':
          return (
            <ImageBox
              source={require('@assets/images/ogHotspot.png')}
              width={240}
              height={240}
              resizeMode="contain"
              marginTop="-xl"
              {...boxProps}
            />
          )
        case 'Polyhex':
          return (
            <ImageBox
              source={require('@assets/images/ogHotspot.png')}
              width={240}
              height={240}
              resizeMode="contain"
              marginTop="-xl"
              {...boxProps}
            />
          )
        case 'SenseCAP':
          return (
            <ImageBox
              source={require('@assets/images/ogHotspot.png')}
              width={240}
              height={240}
              resizeMode="contain"
              marginTop="-xl"
              {...boxProps}
            />
          )
        case 'Atom':
          return (
            <ImageBox
              source={require('@assets/images/ogHotspot.png')}
              width={240}
              height={240}
              resizeMode="contain"
              marginTop="-xl"
              {...boxProps}
            />
          )
        case 'embit':
          return (
            <ImageBox
              source={require('@assets/images/ogHotspot.png')}
              width={240}
              height={240}
              resizeMode="contain"
              marginTop="-xl"
              {...boxProps}
            />
          )
        case 'KS Technologies':
          return (
            <ImageBox
              source={require('@assets/images/ogHotspot.png')}
              width={240}
              height={240}
              resizeMode="contain"
              marginTop="-xl"
              {...boxProps}
            />
          )
        case 'FreedomFi':
          return (
            <ImageBox
              source={require('@assets/images/ffiHotspot.png')}
              width={240}
              height={240}
              resizeMode="contain"
              marginTop="-xl"
              {...boxProps}
            />
          )
        case 'RisingHF':
          return (
            <ImageBox
              source={require('@assets/images/ogHotspot.png')}
              width={240}
              height={240}
              resizeMode="contain"
              marginTop="-xl"
              {...boxProps}
            />
          )
        case 'MNTD':
          return (
            <ImageBox
              source={require('@assets/images/mntdHotspot.png')}
              width={300}
              height={400}
              resizeMode="contain"
              marginTop="-40"
              {...boxProps}
            />
          )
        case 'Dragino':
          return (
            <ImageBox
              source={require('@assets/images/ogHotspot.png')}
              width={240}
              height={240}
              resizeMode="contain"
              marginTop="-xl"
              {...boxProps}
            />
          )
        case 'hummingbird':
          return (
            <ImageBox
              source={require('@assets/images/ogHotspot.png')}
              width={240}
              height={240}
              resizeMode="contain"
              marginTop="-xl"
              {...boxProps}
            />
          )
        case 'Migrated Helium Hotspot':
          return (
            <ImageBox
              source={require('@assets/images/ogHotspot.png')}
              width={240}
              height={240}
              resizeMode="contain"
              marginTop="-xl"
              {...boxProps}
            />
          )
        case 'Milesight':
          return (
            <ImageBox
              source={require('@assets/images/ogHotspot.png')}
              width={240}
              height={240}
              resizeMode="contain"
              marginTop="-xl"
              {...boxProps}
            />
          )
        case 'Pisces Miner':
          return (
            <ImageBox
              source={require('@assets/images/ogHotspot.png')}
              width={240}
              height={240}
              resizeMode="contain"
              marginTop="-xl"
              {...boxProps}
            />
          )
        case 'PantherX':
          return (
            <ImageBox
              source={require('@assets/images/ogHotspot.png')}
              width={240}
              height={240}
              resizeMode="contain"
              marginTop="-xl"
              {...boxProps}
            />
          )
        case 'Nebra 5G':
          return (
            <ImageBox
              source={require('@assets/images/ogHotspot.png')}
              width={240}
              height={240}
              resizeMode="contain"
              marginTop="-xl"
              {...boxProps}
            />
          )
        case 'ClodPi':
          return (
            <ImageBox
              source={require('@assets/images/ogHotspot.png')}
              width={240}
              height={240}
              resizeMode="contain"
              marginTop="-xl"
              {...boxProps}
            />
          )
        case 'Deeper':
          return (
            <ImageBox
              source={require('@assets/images/ogHotspot.png')}
              width={240}
              height={240}
              resizeMode="contain"
              marginTop="-xl"
              {...boxProps}
            />
          )
        case 'LongAP':
          return (
            <ImageBox
              source={require('@assets/images/ogHotspot.png')}
              width={240}
              height={240}
              resizeMode="contain"
              marginTop="-xl"
              {...boxProps}
            />
          )
        case 'Aitek Inc':
          return (
            <ImageBox
              source={require('@assets/images/ogHotspot.png')}
              width={240}
              height={240}
              resizeMode="contain"
              marginTop="-xl"
              {...boxProps}
            />
          )
        case 'Kerlink':
          return (
            <ImageBox
              source={require('@assets/images/kerlinkHotspot.png')}
              width={240}
              height={240}
              resizeMode="contain"
              marginTop="-2xl"
              {...boxProps}
            />
          )
        case 'ResIOT.io':
          return (
            <ImageBox
              source={require('@assets/images/ogHotspot.png')}
              width={240}
              height={240}
              resizeMode="contain"
              marginTop="-xl"
              {...boxProps}
            />
          )
        case 'SyncroB.it':
          return (
            <ImageBox
              source={require('@assets/images/ogHotspot.png')}
              width={240}
              height={240}
              resizeMode="contain"
              marginTop="-xl"
              {...boxProps}
            />
          )
        case 'Bobcat 5G':
          return (
            <ImageBox
              source={require('@assets/images/ogHotspot.png')}
              width={240}
              height={240}
              resizeMode="contain"
              marginTop="-xl"
              {...boxProps}
            />
          )
        case 'Linxdot':
          return (
            <ImageBox
              source={require('@assets/images/ogHotspot.png')}
              width={240}
              height={240}
              resizeMode="contain"
              marginTop="-xl"
              {...boxProps}
            />
          )
        case 'Controllino':
          return (
            <ImageBox
              source={require('@assets/images/ogHotspot.png')}
              width={240}
              height={240}
              resizeMode="contain"
              marginTop="-xl"
              {...boxProps}
            />
          )
        case 'EDA-IoT':
          return (
            <ImageBox
              source={require('@assets/images/ogHotspot.png')}
              width={240}
              height={240}
              resizeMode="contain"
              marginTop="-xl"
              {...boxProps}
            />
          )
        case 'TMG':
          return (
            <ImageBox
              source={require('@assets/images/ogHotspot.png')}
              width={240}
              height={240}
              resizeMode="contain"
              marginTop="-xl"
              {...boxProps}
            />
          )
        case 'Midas':
          return (
            <ImageBox
              source={require('@assets/images/ogHotspot.png')}
              width={240}
              height={240}
              resizeMode="contain"
              marginTop="-xl"
              {...boxProps}
            />
          )
        case 'uG Miner':
          return (
            <ImageBox
              source={require('@assets/images/ogHotspot.png')}
              width={240}
              height={240}
              resizeMode="contain"
              marginTop="-xl"
              {...boxProps}
            />
          )
        case 'Pycom':
          return (
            <ImageBox
              source={require('@assets/images/ogHotspot.png')}
              width={240}
              height={240}
              resizeMode="contain"
              marginTop="-xl"
              {...boxProps}
            />
          )
        case 'Browan/MerryIoT':
          return (
            <ImageBox
              source={require('@assets/images/merryIotHotspot.png')}
              width={240}
              height={400}
              marginTop="-48"
              resizeMode="contain"
              {...boxProps}
            />
          )
      }
    },
    [maker],
  )

  return <Image deviceType={deviceType} subDao={subDao} {...rest} />
}

export default MakerHotspotImage
