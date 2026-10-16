import { DataTypes } from '@sequelize/core'

export async function up({ context: queryInterface }) {
  // this migration adds private event metadata for API clients and plugins -> https://framagit.org/les/gancio/-/work_items/716
  await queryInterface.createTable('event_metadata', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    eventId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { table: 'events', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    key: {
      type: DataTypes.STRING,
      allowNull: false
    },
    value: {
      type: DataTypes.TEXT
    },
    createdAt: {
      allowNull: false,
      type: DataTypes.DATE
    },
    updatedAt: {
      allowNull: false,
      type: DataTypes.DATE
    }
  })

  await queryInterface.addIndex('event_metadata', ['eventId', 'key'], { unique: true, name: 'event_metadata_event_id_key' })
  await queryInterface.addIndex('event_metadata', ['key'], { name: 'event_metadata_key' })
}

export function down({ context: queryInterface }) {
  return queryInterface.dropTable('event_metadata')
}
