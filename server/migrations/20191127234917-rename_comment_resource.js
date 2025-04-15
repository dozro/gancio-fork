export async function up ({ context: queryInterface }) {
  console.error('dentro renameTable')
  return await queryInterface.renameTable('comments', 'resources')
}

export function  down ({ context: queryInterface }) {
  return queryInterface.renameTable('resources', 'comments')
}
