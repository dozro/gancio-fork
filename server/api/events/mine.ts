/**
 * Get events created by the current user.
 * @auth
 */
export default defineEventHandler(async (event) => {
    const user = await requireUser(event)
    
    return sendEvents(event, await getEvents({ user_id: user.id }))
})