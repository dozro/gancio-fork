import { Tag, Place, Event } from './sequelize'

export async function getTagEvents (tag: string | undefined) {
  if (!tag) { 
    throw createError({ status: 404, message: 'Tag not specified' })
  }
    return getEvents({ tags: [tag] })

}