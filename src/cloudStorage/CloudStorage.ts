import { Platform } from 'react-native'
import iCloudStorage from 'react-native-icloudstore'
import AsyncStorage from '@react-native-async-storage/async-storage'

// for android we use AsyncStorage and auto backup to Google Drive using
// https://developer.android.com/guide/topics/data/autobackup
const CloudStorage = Platform.OS === 'ios' ? iCloudStorage : AsyncStorage

export default CloudStorage
