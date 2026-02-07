import { DataTypes } from '@sequelize/core'

export async function up({ context: queryInterface }) {
  await queryInterface.sequelize.query("UPDATE events SET status = 'EventScheduled' WHERE status IS NULL")
  return queryInterface.changeColumn('events', 'status', { type: DataTypes.ENUM(['EventCancelled', 'EventScheduled', 'EventTentative', 'EventMovedOnline', 'EventPostponed', 'EventRescheduled']), defaultValue: 'EventScheduled', allowNull: false })
}
