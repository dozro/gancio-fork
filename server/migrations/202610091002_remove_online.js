export async function up({ context: queryInterface }) {
  // this migration removes the online place -> https://framagit.org/les/gancio/-/work_items/709
  const [places] = await queryInterface.sequelize.query(`SELECT id FROM places WHERE name = 'online'`)
  const placeIds = places.map(place => place.id)
  if (placeIds.length) {
    await queryInterface.bulkUpdate(
      'events',
      { placeId: null },
      { where: { placeId: placeIds } }
    )
  }
  await queryInterface.bulkDelete('places', { where: { name: 'online' } })
}
