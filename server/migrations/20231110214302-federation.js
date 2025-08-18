import { DataTypes } from '@sequelize/core'

export async function up ({ context: queryInterface }) {
  return Promise.all(
    [
      await queryInterface.addColumn('ap_users', 'trusted', { type: DataTypes.BOOLEAN }),
      await queryInterface.addColumn('instances', 'applicationActor', { type: DataTypes.STRING }),
      await queryInterface.addColumn('ap_users', 'following', { type: DataTypes.BOOLEAN }),
      await queryInterface.addColumn('filters', 'actors', { type: DataTypes.JSON }),
      await queryInterface.addColumn('events', 'ap_id', { type: DataTypes.STRING, index: true }),
      await queryInterface.addColumn('events', 'apUserApId', {
        type: DataTypes.STRING,
        references: {
          table: 'ap_users',
          key: 'ap_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      }),
    ])
  }
