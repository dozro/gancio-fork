import { z } from 'zod'
import { createError } from 'h3'
import type { WhereOptions } from '@sequelize/core'
import { useLogger } from '../lib/logger'
import type { UserSession } from '../lib/session'
import { Event, EventMetadata } from './db'
import { canModifyEvent } from './events'

// private event metadata for API clients and plugins -> https://framagit.org/les/gancio/-/work_items/716
const log = useLogger('metadata')

export const MAX_METADATA_PER_EVENT = 50
export const MAX_METADATA_VALUE_LENGTH = 10000

export const metadataKeySchema = z.string()
  .min(1, { error: 'metadata key cannot be empty' })
  .max(255, { error: 'metadata key is too long' })
  .regex(/^[\w.:-]+$/, { error: 'metadata key can contain only letters, numbers and _ . : -' })

export const metadataValueSchema = z.string({ error: 'metadata value must be a string' })
  .max(MAX_METADATA_VALUE_LENGTH, { error: 'metadata value is too long' })

/** a `null` value removes the key */
export const metadataPayloadSchema = z.record(metadataKeySchema, metadataValueSchema.nullable(), { error: 'metadata must be an object' })

export type EventMetadataRecord = Record<string, string | null>

export async function getEventMetadata(eventId: number): Promise<EventMetadataRecord> {
  const rows = await EventMetadata.findAll({
    where: { eventId },
    attributes: ['key', 'value'],
    order: [['key', 'ASC']]
  })
  return Object.fromEntries(rows.map(row => [row.key, row.value]))
}

/**
 * Merge `entries` into the event metadata: keys with a `null` value are removed,
 * other keys are created or updated. Keys not specified are left untouched.
 * @returns the resulting metadata of the event
 */
export async function setEventMetadata(eventId: number, entries: EventMetadataRecord): Promise<EventMetadataRecord> {
  const toRemove = Object.keys(entries).filter(key => entries[key] === null)
  const toSet = Object.entries(entries).filter((entry): entry is [string, string] => entry[1] !== null)

  await EventMetadata.sequelize.transaction(async (transaction) => {
    if (toRemove.length) {
      await EventMetadata.destroy({ where: { eventId, key: toRemove }, transaction })
    }

    if (toSet.length) {
      const existing = await EventMetadata.findAll({ where: { eventId, key: toSet.map(([key]) => key) }, transaction })
      for (const [key, value] of toSet) {
        const row = existing.find(r => r.key === key)
        if (row) {
          if (row.value !== value) {
            await row.update({ value }, { transaction })
          }
        } else {
          await EventMetadata.create({ eventId, key, value }, { transaction })
        }
      }
    }

    const count = await EventMetadata.count({ where: { eventId }, transaction })
    if (count > MAX_METADATA_PER_EVENT) {
      throw createError({ statusCode: 400, message: `Too many metadata for this event (max ${MAX_METADATA_PER_EVENT})` })
    }
  })

  return getEventMetadata(eventId)
}

export async function removeEventMetadata(eventId: number, key: string) {
  return EventMetadata.destroy({ where: { eventId, key } })
}

/**
 * Find metadata by key (and optionally by value), e.g. to find an imported event by its source UID.
 * When `user` is specified only metadata of events the user can modify are returned.
 */
export async function findEventsByMetadata(key: string, value?: string, user?: UserSession) {
  const where: WhereOptions<EventMetadata> = { key, ...(value !== undefined && { value }) }
  const restrictToOwner = user && !['admin', 'editor'].includes(user.role)

  const rows = await EventMetadata.findAll({
    where,
    attributes: ['eventId', 'key', 'value'],
    order: [['eventId', 'ASC']],
    ...(restrictToOwner && {
      include: [{ model: Event, required: true, attributes: [], where: { userId: user.id } }]
    })
  })
  return rows.map(row => ({ eventId: row.eventId, key: row.key, value: row.value }))
}

/**
 * Get an event to read/write its metadata, throwing an error if the event does not exist
 * or the user cannot modify it
 */
export async function getModifiableEvent(id: unknown, user: UserSession) {
  const eventId = Number(id)
  const event = Number.isInteger(eventId) ? await Event.findByPk(eventId) : null
  if (!event) {
    log.warn('Event not found: %s', id)
    throw createError({ statusCode: 404, message: 'Event not found' })
  }

  if (!canModifyEvent(event, user)) {
    log.warn('User not authorized to access metadata of event: %s', id)
    throw createError({ statusCode: 403, message: 'You are not authorized to modify this event' })
  }
  return event
}
