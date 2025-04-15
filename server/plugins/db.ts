export default defineNitroPlugin(async (nitro) => {
    try {
        const sequelize = await connect()
        await sequelize.queryRaw("SELECT * FROM users limit 1")

        // load settings
        await loadSettings()
    } catch (e) {
        console.error(e)
    }
})