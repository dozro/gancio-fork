import { defineEventHandler, getRouterParam } from 'h3'
import { Filter } from '~~/server/services'

export default defineEventHandler(async (event) => {
  const collectionId = getRouterParam(event, 'collection_id')
  return Filter.findAll({ where: { collectionId } })
})
