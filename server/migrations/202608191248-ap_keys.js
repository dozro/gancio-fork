import { DataTypes } from '@sequelize/core'

export function up ({ context: queryInterface }) {
  return queryInterface.createTable('ap_keys',
    {
      ap_id: {
        type: DataTypes.STRING,
        primaryKey: true
      },
      public_keys: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      apUserApId: {
        type: DataTypes.INTEGER,
        references: { table: 'ap_users', key: 'ap_id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      }
    })
  }
