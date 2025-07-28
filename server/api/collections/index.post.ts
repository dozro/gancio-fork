  /**
  */
export default defineEventHandler(async event => {
  await requireAdminSession(event)
  const log = useLogger('collections')
    
  const collection = await readBody(event)
  log.info(collection)
  return Collection.create(collection)
})