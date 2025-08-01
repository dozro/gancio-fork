export default defineEventHandler(async (event) => {
  // const session = await getUserSession(event)
  const log = useLogger('log')
  log.debug(event.path, event.method)
})
