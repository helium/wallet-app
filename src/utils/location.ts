import Config from 'react-native-config'
import Geocoder from 'react-native-geocoding'

export const getAddressFromLatLng = async (
  latitude: number,
  longitude: number,
) => {
  Geocoder.init(Config.GOOGLE_MAPS_API_KEY || '')
  const geocode = await Geocoder.from({
    latitude,
    longitude,
  })
  const postalCode = geocode.results[0].address_components.find((c) =>
    c.types.includes('postal_code'),
  )?.short_name
  const country = geocode.results[0].address_components.find((c) =>
    c.types.includes('country'),
  )?.short_name
  let city = geocode.results[0].address_components.find(
    (c) =>
      c.types.includes('locality') || c.types.includes('sublocality_level_1'),
  )?.long_name

  const state = geocode.results[0].address_components.find((c) =>
    c.types.includes('administrative_area_level_1'),
  )?.short_name

  const street = geocode.results[0].address_components.find((c) =>
    c.types.includes('route'),
  )?.long_name

  if (!city) {
    // if city is still not defined, and address components has a neighborhood, use that
    // e.g. liverpool, NY
    const neighborhood = geocode.results[0].address_components.find((c) =>
      c.types.includes('neighborhood'),
    )
    if (neighborhood) {
      city = neighborhood.long_name
    }
  }

  return { city, postalCode, country, street, state }
}
