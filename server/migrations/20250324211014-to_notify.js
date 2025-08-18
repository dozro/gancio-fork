import { DataTypes } from '@sequelize/core'

export async function up ({ context: queryInterface }) {
  await queryInterface.addColumn('users', 'to_notify', { type: DataTypes.BOOLEAN })
}
