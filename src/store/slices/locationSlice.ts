import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { BN } from '@coral-xyz/anchor'
import { Geo, reverseGeoCode } from '../../hooks/useReverseGeo'
import { parseH3BNLocation } from '../../utils/h3'

export type State = {
  locations: Record<string, Geo>
}
const initialState: State = {
  locations: {},
}

export const getGeocodedAddress = createAsyncThunk<
  | {
      geo: Geo
      hex: string
    }
  | undefined,
  { location?: BN }
>(
  'location/getGeocodedAddress',
  async ({ location: hotspotLocation }, { getState }) => {
    const { location } = (await getState()) as { location: State }

    const hex = hotspotLocation?.toString('hex')
    if (!hex || hex === '0') return

    const geo: Geo | undefined = hotspotLocation
      ? location.locations[hex]
      : undefined

    if (geo) {
      return { geo, hex }
    }

    if (!hotspotLocation) return

    const coords = parseH3BNLocation(hotspotLocation)
    if (!coords) return

    const nextGeo = (await reverseGeoCode(coords.reverse()))?.data
    if (!nextGeo) return

    return {
      geo: nextGeo,
      hex,
    }
  },
)

const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getGeocodedAddress.fulfilled, (state, { payload }) => {
      if (payload?.hex && payload.geo) {
        state.locations[payload.hex] = payload.geo
      }
    })
  },
})

const { reducer, name } = locationSlice
export { name, locationSlice }
export default reducer
