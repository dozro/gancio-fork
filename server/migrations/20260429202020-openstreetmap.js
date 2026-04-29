export async function up({ context: queryInterface }) {
  // Remove this old default value so that it's reset to the new default
  await queryInterface.sequelize.query('DELETE FROM settings WHERE key = "tilelayer_provider" AND value = """https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"""')
}
