export async function up({ context: queryInterface }) {
  // this migration removes the online place -> https://framagit.org/les/gancio/-/work_items/709
  await queryInterface.sequelize.query(
    `UPDATE events SET placeId = NULL WHERE placeId IN (SELECT id FROM places WHERE name = 'online')`)
  await queryInterface.bulkDelete('places', { where: { name: 'online' } })
}
