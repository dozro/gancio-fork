export default defineEventHandler(async (event) => {
  // const session = await getUserSession(event)
  const log = useLogger('log')
  // log.debug(getRequestIP(event,  { xForwardedFor: true }), event.headers.get('user-agent') , event.path, event.method)
  log.debug(event.path, event.method)
})
