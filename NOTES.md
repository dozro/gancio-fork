#### notes for v2.0 release

- [KISS]()

## BREAKING!
- authentication

## TODO
- [ ] check role on server (create a composable?)
- [ ] queue manager (use taskmanager with retries, save on db, cron etc.)
- [ ] client settings management (global public, etc..)
- [ ] fetch events and calendars (useEvents)
- [ ] i18n vuetify
- [ ] header
- [ ] images
- [ ] single events
- [ ] opengraph, alternate link (json-ld, h-event, microdata)
- [ ] card
- [ ] authentication
- [ ] ics need auth

# Nuxt3 / Gancio lifecycle:
- nuxt.config.ts:
  load the `runtimeConfig` from environment: `base_url`, db parameters and gancio `version` from package.json)
  - fallback from legacy config.json?

- loading nitro plugins in server/plugins:
  - connect to the database
  - load settings (populate publicSettings /secretSettings utility)

- nuxt server plugins in server (middleware, api, routes)


- runtime plugins in plugins (.client.ts / .server.ts)

- composable for reusable vue logic (auth)
- plugins for global initialization or inject functionality (provide luxon, provide notify)
- utilities helper function without state

## API / Backend > (/server)

### Getting random values
crypto.randomUUID()


### Settings
You can use the `publicSettings` or `secretSettings` server utilities

### return errors
`throw createError({ status: 404, message: 'Not found' })`

### logs
`const log = useLogger('context')`
log.info / warning / error / debug

### GET params / query
raw: `event.context.params?.place`

### send raw file
`return sendStream(event, fs.createReadStream(filePath))`
check `server/routes/fallbackimage.png.ts`

### Authentication



### CORS
some route needs CORS enabled (e.g. /feed/*)

---

## FrontEnd

### Settings
const { settings } = useSettings()
SSR friendly composable that get public settings from `/api/settings`

### Mobile first
Use `:fullscreen="$vuetify.display?.mobile"` for any `v-dialog`
NOTE: (the issue with this is that $vuetify.display is ready on client only so we do have hydration issues (i.e. i want the calendar to have 2 cols only not in mobile,
this could not be done in SSR, let's test with https://masteringnuxt.com/blog/mobile-detection-with-nuxt-ssr)

### Composable
we use [composables](https://nuxt.com/docs/guide/directory-structure/composables) for utilities like validators, times formatter, events management.
to share state in composable use `useState`

### Call API
use `useFetch` if you need SSR (i.e. loading events at home page).
internally it calls the method only once in SSR and pass the payload to the client that has not to re-fetch the data.
useFetch has an internal key that uses to refresh the request.

use `$fetch` for data needed in client only (i.e. a `v-combobox` with autocompletion)


### Notify user
`$notify('message')`

the message could be a translated string.


## access/ Authorization / validate / user / role
// this is a middleware that redirect to login page when user is not logged in
definePageMeta({ middleware: ['authenticated'] })

const { loggedIn, session, user, clear, fetch } = useUserSession()




## CLI




## Testing

### Auth


## section

- [ ] homepage
- [ ] import event


### infra

- [ ] event card
- [ ] $auth
- [ ] dialog / confirm / snackbar
- [ ] settings
