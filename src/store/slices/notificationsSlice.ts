import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { PURGE } from 'redux-persist'
import { CSAccount } from '../../storage/cloudStorage'
import * as WalletApi from '../../utils/walletApiV2'

type NotificationsByResource = Record<string, WalletApi.Notification[]>

export type BalancesState = {
  notifications: NotificationsByResource
  notificationsLoading: boolean
}

const initialState: BalancesState = {
  notificationsLoading: false,
  notifications: {},
}

export const getNotifications = createAsyncThunk(
  'notifications/getNotifications',
  WalletApi.getNotifications,
)

export const markNotificationRead = createAsyncThunk(
  'notifications/markNotificationRead',
  async ({
    id,
    resource,
    accounts,
  }: {
    resource: string
    id: number
    accounts: CSAccount[]
  }) => WalletApi.postNotificationRead({ id, resource, accounts }),
)

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getNotifications.pending, (state) => {
      state.notificationsLoading = true
    })
    builder.addCase(getNotifications.fulfilled, (state, action) => {
      state.notifications[action.meta.arg.resource] = action.payload
    })
    builder.addCase(getNotifications.rejected, (state) => {
      state.notificationsLoading = false
    })
    builder.addCase(markNotificationRead.fulfilled, (state, action) => {
      const { id: readId, resource } = action.meta.arg
      const idx = state.notifications[resource]?.findIndex(
        ({ id }) => id === readId,
      )
      if (idx === -1) return state

      state.notifications[resource][idx] = {
        ...state.notifications[resource][idx],
        viewedAt: new Date().toISOString(),
      }
    })
    builder.addCase(PURGE, () => initialState)
  },
})

const { reducer, name } = notificationsSlice
export { name, notificationsSlice }
export default reducer
