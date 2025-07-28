
export default defineEventHandler((event) => {
  return { links: [
      { href: `${publicSettings.baseurl}/.well-known/nodeinfo/2.0`, rel: 'http://nodeinfo.diaspora.software/ns/schema/2.0' },
      { href: `${publicSettings.baseurl}/.well-known/nodeinfo/2.1`, rel: 'http://nodeinfo.diaspora.software/ns/schema/2.1' },
      ... publicSettings.enable_federation ? [{
        "rel": "https://www.w3.org/ns/activitystreams#Application",
        "href": `${publicSettings.baseurl}/federation/u/${publicSettings?.instance_name ?? 'relay' }`
      }] : []
    ]}
  })