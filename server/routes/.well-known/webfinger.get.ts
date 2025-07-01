const log = useLogger('webfinger')

export default defineEventHandler(async event => {
  if (!publicSettings.enable_federation) {
    throw createError({ statusCode: 404, statusMessage: 'Federation disabled' })
  }
  
  const { resource } = getQuery(event)
  if (!resource || !resource?.includes('acct:')) {
    log.info('Bad webfinger request => ', resource)
    throw createError({ statusCode: 400, statusMessage: 'Bad request. Please make sure "acct:USER@DOMAIN" is what you are sending as the "resource" query parameter.' })
  }
  
  const domain = (new URL(publicSettings.baseurl)).host
  const [, name, req_domain] = resource?.match(/acct:(.*)@(.*)/)
  if (domain !== req_domain) {
    log.warn(`Bad webfinger request, requested domain "${req_domain}" instead of "${domain}"`)
    throw createError({ statusCode: 400, statusMessage: 'Bad request. Please make sure "acct:USER@DOMAIN" is what you are sending as the "resource" query parameter.' })
  }
  if (name !== publicSettings.instance_name) {
    log.warn(`User not found: ${name} (instance name is ${publicSettings.instance_name}`)
    throw createError({ statusCode: 404, statusMessage: `No record found for ${name}, are you searching for ${publicSettings.instance_name} ?` })
  }

  log.info(`webfinger ${resource} ${domain}`)
  setHeader(event, 'Content-Type', 'application/jrd+json')
  return {
    subject: `acct:${name}@${domain}`,
    links: [
      {
        rel: 'self',
        type: 'application/activity+json',
        href: `${publicSettings.baseurl}/federation/u/${name}`
      },
      {
        "href" : publicSettings.baseurl + '/logo.png',
        "rel" : "http://webfinger.net/rel/avatar",
        "type" : "image/png"
     }
    ]
  }
})