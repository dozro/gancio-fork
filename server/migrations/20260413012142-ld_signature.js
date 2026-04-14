import { DataTypes } from '@sequelize/core'

export async function up({ context: queryInterface }) {
  // new ld_signature
  await queryInterface.addColumn('events', 'ld_signature', { type: DataTypes.JSON })
}
