export async function up({ context: queryInterface }) {
  const [rows] = await queryInterface.sequelize.query(`SELECT id FROM settings WHERE key = 'tilelayer_provider'`)
  const setting = rows.find(row => row.value === 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')

  // Remove this old default value so that it's reset to the new default
  if (setting) {
    await queryInterface.bulkDelete('settings', { where: { key: setting.key } })
  }
}
