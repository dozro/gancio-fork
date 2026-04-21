import { type H3Event, useSession, createError } from 'h3'
import type { UserRole } from '../services/db'
import { getUser } from './getUser'

export type UserSession = { id: number, email: string, role: UserRole }

export async function setSession(event: H3Event, user: UserSession) {
  const session = await useSession(event, { password: process.env.NUXT_SESSION_PASSWORD!, name: 'nuxt-session' })
  await session.update(user)
  return session.data
}

/**
 * Require an user to be authenticated (via cookie or JWT token)
 */
export async function requireUser(event: H3Event) {
  const user = await getUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  return user
}

// require current user role to be one of the specified
export async function requireSessionRole(evt: H3Event, roles: UserRole[] | UserRole) {
  const user = await isSessionRole(evt, roles)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  return user
}

// check if current user role is one of specified
export async function isSessionRole(evt: H3Event, roles: UserRole[] | UserRole) {
  const user = await getUser(evt)
  if (!user) return
  if (!Array.isArray(roles)) {
    roles = [roles]
  }
  return roles.includes(user?.role) ? user : false
}

/**
 * Require an admin session, throw a 401 error if the user is not logged in
 */
export async function requireAdminSession(evt: H3Event) {
  return requireSessionRole(evt, 'admin')
}
