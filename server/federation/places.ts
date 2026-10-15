import type { CreationAttributes } from '@sequelize/core'
import { useLogger } from '../lib/logger'
import type { APEvent, APLocation } from './types'
import { publicSettings } from '../services/settings'
import type { Place } from '../services/db'

/**
  * Parses the location of an ActivityPub Event to extract physical and online locations.
  * @link https://www.w3.org/TR/activitystreams-vocabulary/#places
  * @link https://fediverse.codeberg.page/fep/fep/8a8e/#location
  */
export async function parseAPLocation(APEvent: APEvent): Promise<{ place?: CreationAttributes<Place>, online_locations?: string[] }> {
  const log = useLogger('federation:places')
  let place: CreationAttributes<Place> | undefined = undefined

  if (!APEvent?.location) {
    log.warn(`Event "${APEvent?.name}" has no location field`)
    throw new Error('Event has no location field')
  }

  const locations = Array.isArray(APEvent.location) ? APEvent.location : [APEvent.location]

  // find the first physical place from locations (we support only one physical place, if there are more we just ignore them)
  const location = locations.find(location => location?.type !== 'VirtualLocation')

  // get the list of online locations
  const online_locations = new Set(locations.flatMap(location => location.type === 'VirtualLocation' && location.url ? [location.url] : []))

  // online locations could be in attachments too
  APEvent?.attachment?.forEach(a => {
    if (a.type === 'Link' && a?.href) {
      online_locations.add(a.href)
    }
  })

  // we have a physical place
  if (location) {
    if (!location?.name) {
      log.warn(`Event has a location without a name: ${JSON.stringify(location)}`)
      throw new Error('Location must have at least a name')
    }

    const latitude = location.latitude
    const longitude = location.longitude
    place = {
      name: location?.name,
      ...(location?.id && { ap_id: location.id }),
      ...(latitude && longitude && { latitude, longitude })
    }
    // no physical but at least virtual location
    // the `address` field could be Text, PostalAddress we do support the name as a fallback
    const address = location?.address
    if (address) {
      if (typeof address === 'string') {
        place.address = address
      } else if (address?.streetAddress || address?.addressLocality || address?.addressCountry || address?.addressRegion) {
        place.postal_address = address
        place.address = [address?.streetAddress, address?.addressLocality, address?.addressRegion, address?.addressCountry]
          .filter(part => part).join(', ')
      } else {
        log.warn(`Event "${APEvent?.name}" has bad address: ${JSON.stringify(address)}`)
      }
    } else {
      place.address = place.name
    }
  }

  return { place, online_locations: [...online_locations] }
}

/**
 * @returns ActivityStream location representation
 * @link https://www.w3.org/TR/activitystreams-vocabulary/#places
 */
export function PlaceToAP(place: Place): APLocation {
  return {
    id: place?.ap_id || `${publicSettings.baseurl}/federation/p/${place.id}`,
    type: 'Place',
    name: place.name,
    address: place.postal_address || place.address,
    url: place?.ap_id || `${publicSettings.baseurl}/place/${place.id}/${encodeURIComponent(place.name)}`,
    ...(place.latitude && place.longitude && ({ latitude: place.latitude, longitude: place.longitude }))
  }
}
