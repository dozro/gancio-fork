export async function up({ context: queryInterface }) {
  // Remove this old default value so that it's reset to the new default
  await queryInterface.bulkDelete('settings', {
    key: 'tilelayer_provider',
    value: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
  })
}
