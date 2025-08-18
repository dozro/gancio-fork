import { DataTypes } from '@sequelize/core'

export async function up ({ context: queryInterface }) {
  async function go () {
    await queryInterface.addColumn('users', 'role', {
      type: DataTypes.ENUM(['admin', 'editor', 'user']),
      defaultValue: 'user'
    })

    // const user = User(queryInterface.sequelize, DataTypes.DataTypes)
    // await user.update({ role: 'admin'}, { where: { is_admin: true } })
  }
  return go()
}
