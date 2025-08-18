import { DataTypes } from '@sequelize/core'

export async function up ({ context: queryInterface }) {
  return queryInterface.changeColumn('pages', 'content', {
    type: DataTypes.TEXT
  })
}