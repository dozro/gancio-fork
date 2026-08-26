import { DataTypes } from '@sequelize/core'

export async function up({ context: queryInterface }) {
  // Call sync() to flush pending changes from previous transanctions.
  // Without this, a SQLITE_BUSY error is sometimes thrown. And to make things
  // worse, the error is unhandled in some async function deep into the call
  // stack and the migration "succeeds", hiding the problem.
  await queryInterface.sequelize.sync()
  await queryInterface.addColumn('places', 'postal_address',
    { type: DataTypes.JSON, allowNull: true })
  // as we have strings, let's convert to JSON strings:
  // const [rows] = await queryInterface.sequelize.query('SELECT id, address FROM places WHERE address IS NOT NULL')

  // for (const row of rows) {
  //   await queryInterface.sequelize.query('UPDATE places SET address = :address WHERE id = :id',
  //     {
  //       replacements: {
  //         id: row.id,
  //         address: JSON.stringify(row.address)
  //       }
  //     })
  // }

  // return queryInterface.changeColumn('places', 'address', {
  //   type: DataTypes.JSON,
  //   allowNull: true,
  // })
}
