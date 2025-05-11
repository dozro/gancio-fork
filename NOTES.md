#### notes for v2.0 release

## BREAKING!
- authentication


## API

### Settings
You can use the `publicSettings` or `secretSettings` utilities

### return errors
throw createError({ status: 404, message: 'Not found' })

### logs
const log = useLogger('context')
log.info / warning / error / debug

### GET params / query



### CORS
some route needs CORS enabled (e.g. /feed/*)

## FrontEnd

## Modal / dialog
Please use `:fullscreen="$vuetify.display?.mobile"` for any `v-dialog`

### Call API

### Notify user

## access/ Authorization / validate / user / role
// this is a middleware that redirect to login page when user is not logged in
definePageMeta({ middleware: ['authenticated'] })

const { loggedIn, session, user, clear, fetch } = useUserSession()




## CLI




## Testing




## section

- [ ] homepage
- [ ] import event


### infra

- [ ] event card
- [ ] $auth
- [ ] dialog / confirm / snackbar
- [ ] settings
