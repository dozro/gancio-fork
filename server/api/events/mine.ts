
export default defineEventHandler(async (event) => {
    const { user } = await requireUser(event)
    
    return getEvents({ user_id: user.id })
    // return getEvents()
})