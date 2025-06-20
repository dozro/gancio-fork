
export default defineEventHandler(async (event) => {
    const { user } = await requireUserSession(event)
    return getEvents({ user_id: user.id })
    // return getEvents()
})