import { DataTypes } from '@sequelize/core'

export async function up ({ context: queryInterface }) {
  return Promise.all(
    [
      await queryInterface.addColumn('places', 'latitude', { type: DataTypes.DOUBLE}),
      await queryInterface.addColumn('places', 'longitude', { type: DataTypes.DOUBLE })
    ])
  }