import { DataTypes } from '@sequelize/core'

export async function up({ context: queryInterface }) {
  // fix old bad collection migration
  const table = await queryInterface.describeTable('collections')

  if (!table.sortIndex) {
    return queryInterface.addColumn('collections', 'sortIndex', { type: DataTypes.INTEGER })
  }
}
