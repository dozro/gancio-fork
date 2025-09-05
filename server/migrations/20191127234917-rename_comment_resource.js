export async function up ({ context: queryInterface }) {
  return await queryInterface.renameTable('comments', 'resources')
}

export function  down ({ context: queryInterface }) {
  return queryInterface.renameTable('resources', 'comments')
}
