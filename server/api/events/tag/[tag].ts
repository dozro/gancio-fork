import { getTagEvents } from "~~/server/utils/tag"

export default defineEventHandler(async evt => {
    const tag = getRouterParam(evt, 'tag')
    return getTagEvents(tag)
})
