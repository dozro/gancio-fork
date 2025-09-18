export default defineEventHandler(async event => {

  const nominatim = {
    getIcon (item) {
      if (item.class.includes(['place', 'amenity', 'shop', 'tourism', 'leisure', 'building'])) {
        return 'mdi-home'
      }
      
      const type = item.type.toLowerCase()
      const iconMap = {
        way: 'mdi-road-variant',
        house: 'mdi-home',
        node: 'mdi-map-marker',
        relation: 'mdi-city-variant',
      }
      
      return iconMap[type] || 'mdi-home'
    }
  }
  
  
  const log = useLogger('geocode')
  const { q: details }= getQuery(event)
  
  const endpoint = publicSettings.geocoding_provider || 'https://nominatim.openstreetmap.org/search' 
  
  log.info('Fetching details for', details)
  
  const countrycodes = publicSettings.geocoding_countrycodes || []
  const params = {
    countrycodes: countrycodes.join(','),
    q: details,
    limit: 3,
    format: 'json',
    addressdetails: 1,
    namedetails: 1
  }

  const filterNameFromAddress = ['place', 'amenity', 'shop', 'tourism', 'leisure', 'building']
  const addressList = await $fetch(endpoint, { 
    params,
    headers: { 'User-Agent': `gancio` }
  })

  log.info('Fetched details for', addressList)

  return addressList?.map(v => {
    const name = v?.namedetails?.alt_name ?? v?.namedetails?.name
    const address = filterNameFromAddress.includes(v.class) ? v.display_name.replace(name, '').replace(/^, ?/, '') : v.display_name.replace(/^, ?/, '')
    return {
      icon: nominatim.getIcon(v),
      lat: v.lat,
      lon: v.lon,
      name,
      address
    }
  }) 
  
})