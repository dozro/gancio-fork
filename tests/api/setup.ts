import { connect, User } from '../../server/services/db'
import { DateTime } from 'luxon'

export async function cleanDatabase(register = false) {
  const sequelize = await connect()
  try {
    await Promise.allSettled([
      sequelize.query(`DELETE FROM events`),
      sequelize.query('DELETE FROM ap_users'),
      sequelize.query('DELETE FROM events'),
      sequelize.query('DELETE FROM event_tags'),
      sequelize.query('DELETE FROM resources'),
      sequelize.query('DELETE FROM instances'),
      sequelize.query('DELETE FROM settings'),
      sequelize.query('DELETE FROM announcements'),
      sequelize.query('DELETE FROM oauth_tokens'),
      sequelize.query('DELETE FROM users'),
      sequelize.query('DELETE FROM tags'),
      sequelize.query('DELETE FROM places'),
      sequelize.query('DELETE FROM filters'),
      sequelize.query('DELETE FROM collections'),
      sequelize.query('DELETE FROM notifications'),
      sequelize.query('DELETE FROM tasks')
    ])
  } catch (e) {
    console.error(e)
  }
  if (register) {
    const adminUser = await User.create({
      email: 'admin',
      password: 'password',
      role: 'admin',
      is_active: true
    })
    const editorUser = await User.create({
      email: 'editor',
      password: 'password',
      role: 'editor',
      is_active: true
    })
    const userUser = await User.create({
      email: 'user',
      password: 'password',
      role: 'user',
      is_active: true
    })
    const anotherUser = await User.create({
      email: 'another',
      password: 'password',
      role: 'user',
      is_active: true
    })
    return { adminUser, editorUser, userUser, anotherUser }
  }
}

export function now() {
  return DateTime.now().toUnixInteger()
}

export const admin = JSON.stringify({ email: 'admin', password: 'password', grant_type: 'password', client_id: 'self' })