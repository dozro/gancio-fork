import { DataTypes } from '@sequelize/core'

export async function up({ context: queryInterface }) {
  return Promise.all(
    [
      await queryInterface.addColumn('collections', 'updatedAt', { type: DataTypes.DATE }),
      await queryInterface.addColumn('collections', 'createdAt', { type: DataTypes.DATE }),
    ])
}
