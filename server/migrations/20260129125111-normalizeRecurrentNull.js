import { DataTypes } from '@sequelize/core'

export async function up({ context: queryInterface }) {
  await queryInterface.sequelize.query(`UPDATE events SET recurrent = NULL WHERE recurrent IS NULL OR recurrent = 'null' OR recurrent = 'null'`)
}
