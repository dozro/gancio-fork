// import { APUser } from "~/server/utils/sequelize"

export default defineEventHandler(async event => {
  const log = useLogger('federation actor')
  // const { preferHTML } = require('../helpers')
  // if (preferHTML(req)){
  //   log.debug('[FEDI] Get actor but prefer text/html, redirect to homepage')
  //   return res.redirect(302, '/')
  // }
    
  const name = getRouterParam(event, 'name')
    if (!name) {
      log.warn(`[FEDI] Bad request`)
      throw createError({ statusCode: 400, statusMessage: 'Bad request' })
    }
    
    if (name !== publicSettings.instance_name) {
      log.debug(`[FEDI] Get unknown actor ${name} (should be ${publicSettings.instance_name}`)
      throw createError({
        statusCode: 404,
        statusMessage: `No record found for ${name} (are you searching for ${publicSettings.instance_name} ?`
      })
    }
    
    setResponseHeader(event, 'Content-Type', 'application/activity+json; charset=utf-8')
    
    return {
      '@context': [
        'https://www.w3.org/ns/activitystreams',
        'https://w3id.org/security/v1',
        {
          toot: 'http://joinmastodon.org/ns#',

          // A property-value pair, e.g. representing a feature of a product or place. We use this to publish this very same instance
          // https://docs.joinmastodon.org/spec/activitypub/#PropertyValue
          schema: 'http://schema.org#',
          ProperyValue: 'schema:PropertyValue',
          value: 'schema:value',

          // https://docs.joinmastodon.org/spec/activitypub/#discoverable
          discoverable: 'toot:discoverable',

          indexable: 'toot:indexable'
        }
      ],
      id: `${publicSettings.baseurl}/federation/u/${name}`,
      type: 'Application',
      summary: publicSettings.description,
      name: publicSettings.title,
      preferredUsername: name,
      inbox: `${publicSettings.baseurl}/federation/u/${name}/inbox`,
      outbox: `${publicSettings.baseurl}/federation/u/${name}/outbox`,
      manuallyApprovesFollowers: false,
      endpoints: { sharedInbox: `${publicSettings.baseurl}/federation/u/${name}/inbox` },
      discoverable: true,
      indexable: true,
      attachment: [
        {
          type: 'PropertyValue',
          name: 'Website',
          value: `<a href='${publicSettings.baseurl}'>${publicSettings.baseurl}</a>`
        }
      ],
      icon: {
        type: 'Image',
        mediaType: 'image/png',
        url: publicSettings.baseurl + '/logo.png'
      },
      publicKey: {
        id: `${publicSettings.baseurl}/federation/u/${name}#main-key`,
        owner: `${publicSettings.baseurl}/federation/u/${name}`,
        publicKeyPem: publicSettings.publicKey
      },
      url: `${publicSettings.baseurl}/federation/u/${name}`
    }
})