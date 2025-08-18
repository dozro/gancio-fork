import { DataTypes } from '@sequelize/core'

export async function up ({ context: queryInterface }) {
  return queryInterface.addColumn('filters', 'negate', { type: DataTypes.BOOLEAN })
}
