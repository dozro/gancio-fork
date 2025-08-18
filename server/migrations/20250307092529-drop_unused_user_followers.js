import { DataTypes } from '@sequelize/core'

export async function up ({ context: queryInterface }) {
  return queryInterface.dropTable('user_followers')
}
