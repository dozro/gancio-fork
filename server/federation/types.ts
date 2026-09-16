import { z } from 'zod'
import type { APUser } from '../services'

const stringOrArray = z.union([z.string(), z.array(z.string())]).optional().transform(v => Array.isArray(v) ? v : v ? [v] : [])

export const APActivityTypeSchema = z.enum([
  'Follow', 'Undo', 'Like', 'Announce',
  'Create', 'Delete', 'Update', 'Accept',
  'EchoRequest', 'QuoteRequest'
])
export type APActivityType = z.infer<typeof APActivityTypeSchema>

export const APProofSchema = z.object({
  type: z.literal('DataIntegrityProof'),
  proofPurpose: z.literal('assertionMethod'),
  cryptosuite: z.literal('eddsa-jcs-2022'),
  proofValue: z.string(),
  verificationMethod: z.string(),
  created: z.string()
})
export type APProof = z.infer<typeof APProofSchema>

export const APActivityBaseSchema = z.object({
  id: z.string().optional(), // id is not mandatory for some activities (i.e. Follow)
  type: APActivityTypeSchema,
  object: z.union([z.string(), z.object({ id: z.string().optional() })]),
  proof: APProofSchema.optional(),
  actor: z.union([z.string(), z.object({ id: z.string() })]).optional().transform(v => typeof v === 'string' ? v : v?.id),
  to: stringOrArray,
  cc: stringOrArray
})

export type APActivityBase = z.infer<typeof APActivityBaseSchema>

// https://www.w3.org/wiki/ActivityPub/Primer/Actors
// https://www.w3.org/TR/activitypub/#actors
export interface APActor {
  id: string
  name: string
  icon: { url: string }
  summary?: string
  preferredUsername: string
  discoverable?: boolean
  indexable?: boolean
  inbox: string
  outbox: string
  type: string
  endpoints?: { sharedInbox?: string }
  attachments?: Array<{
    type: string
    name: string
    url: string
  }>
  url?: string
  publicKey?: {
    id: string
    owner: string
    publicKeyPem: string
  }
  assertionMethod?: Array<{
    id: string
    type: 'Multikey'
    controller: string
    publicKeyMultibase: string
  }>
}

export interface APActivityFollow extends APActivityBase {
  type: 'Follow'
  object: string
}

export interface APActivityAnnounce extends APActivityBase {
  type: 'Announce'
  object: string | APNote | APEvent
}

export interface APActivityLike extends APActivityBase {
  type: 'Like'
  object: string
}

export interface APActivityAccept extends APActivityBase {
  type: 'Accept'
  object: string
}

export interface APActivityLike extends APActivityBase {
  type: 'Like'
  object: string
}

export interface APActivityUndo extends APActivityBase {
  type: 'Undo'
  object: APActivityFollow | APActivityLike | APActivityAnnounce
}

export interface APActivityQuoteRequest extends APActivityBase {
  type: 'QuoteRequest'
  object: string
  instrument: string | { id: string }
}

// https://www.w3.org/TR/activitystreams-vocabulary/#dfn-attachment
export const APAttachmentSchema = z.object({
  type: z.enum(['Image', 'Video', 'Audio', 'Document', 'Link']),
  mediaType: z.string().optional(),
  name: z.string().optional(),
  url: z.url().optional(),
  link: z.url().optional(),
  href: z.url().optional(),
  focalPoint: z.array(z.number()).length(2).optional()
})
export type APAttachment = z.infer<typeof APAttachmentSchema>

export const APNoteSchema = z.object({
  type: z.literal('Note').default('Note'),
  id: z.string(),
  attributedTo: z.string().optional(),
  inReplyTo: z.string().optional(),
  url: z.url().optional(),
  content: z.string().optional(),
  summary: z.string().optional(),
  published: z.iso.date().optional(),
  updated: z.iso.date().optional(),
  attachment: z.array(APAttachmentSchema).optional(),
  sensitive: z.boolean().optional(),
  to: stringOrArray,
  cc: stringOrArray,
  quote: z.string().optional(),
  quoteUri: z.string().optional(),
  _misskey_quote: z.string().optional()
})
export type APNote = z.infer<typeof APNoteSchema>

export interface APActivityUpdate extends APActivityBase {
  type: 'Update'
  object: APEvent | APNote
}

export interface APActivityCreate extends APActivityBase {
  type: 'Create'
  object: APEvent | APNote | string
}

export interface APActivityDelete extends APActivityBase {
  type: 'Delete'
  object: {
    id?: string
    type: 'Tombstone' | 'Event' | 'Note'
    formerType?: 'Tombstone' | 'Event' | 'Note'
  } | string
}

// https://www.w3.org/TR/activitystreams-vocabulary/#places
// https://fediverse.codeberg.page/fep/fep/8a8e/#physical
// https://schema.org/PostalAddress
export const PostalAddressSchema = z.object({
  type: z.literal('PostalAddress'),
  streetAddress: z.string().optional().nullable(),
  addressLocality: z.string().optional().nullable(),
  addressRegion: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  addressCountry: z.string().optional().nullable()
})
export type PostalAddress = z.infer<typeof PostalAddressSchema>

export const APTagSchema = z.object({
  type: z.enum(['Mention', 'Hashtag']),
  name: z.string(),
  href: z.url().optional()
})
export type APTag = z.infer<typeof APTagSchema>

// https://www.w3.org/TR/activitystreams-vocabulary/#dfn-place
export const APLocationSchema = z.object({
  type: z.enum(['Place', 'VirtualLocation']),
  name: z.string().optional(),
  id: z.string().optional(),
  url: z.url().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  address: z.union([PostalAddressSchema, z.string()]).optional()
})
export type APLocation = z.infer<typeof APLocationSchema>

// https://fediverse.codeberg.page/fep/fep/8a8e/#event-status
export const EventStatusEnum = ['EventCancelled', 'EventScheduled', 'EventTentative', 'EventMovedOnline', 'EventPostponed', 'EventRescheduled'] as const

// https://fediverse.codeberg.page/fep/fep/8a8e/
export const APEventSchema = z.object({
  type: z.literal('Event').default('Event'),
  name: z.string().trim(),
  startTime: z.string().refine(v => !isNaN(Date.parse(v))),
  endTime: z.string().nullable().refine(v => v === null || !isNaN(Date.parse(v))).optional(),
  displayEndTime: z.boolean().optional(),
  id: z.string().optional(),
  attributedTo: z.string().optional(),
  to: z.array(z.string()).optional(),
  cc: z.array(z.string()).optional(),
  url: z.url().optional(),
  content: z.string().optional(),
  summary: z.string().optional(),
  eventStatus: z.enum(EventStatusEnum).optional().default('EventScheduled'),
  attachment: z.array(APAttachmentSchema).optional(),
  location: z.union([APLocationSchema, z.array(APLocationSchema)]).optional(),
  tag: z.array(APTagSchema).optional(),
  published: z.iso.datetime().optional(),
  timezone: z.string().optional(),
  signature: z.object().optional().nullable(),
  updated: z.iso.datetime().optional(),
  interactionPolicy: z.object({
    canQuote: z.object({
      automaticApproval: z.string().optional(),
      manualApproval: z.string().optional()
    }).optional()
  }).optional()
}).refine(
  e => !e.endTime || e.endTime > e.startTime,
  { message: 'endTime must be after startTime' }
)
export type APEvent = z.infer<typeof APEventSchema>

export interface APActivityMap {
  Follow: APActivityFollow
  Undo: APActivityUndo
  Create: APActivityCreate
  Delete: APActivityDelete
  Announce: APActivityAnnounce
  Like: APActivityLike
  Accept: APActivityAccept
  Update: APActivityUpdate
  EchoRequest: APActivityBase
  QuoteRequest: APActivityQuoteRequest
}

export type APActivity = APActivityMap[keyof APActivityMap]

export type APHandlerMap = {
  [K in APActivityType]: (
    message: APActivityMap[K],
    actor: APUser
  ) => Promise<void>
}
