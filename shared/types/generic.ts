import type { HookResult } from "@nuxt/schema"
import type { APUser, Event, Place } from "#build/types/nitro-imports"
import type { InferAttributes } from "@sequelize/core"


/**
 * there are two Event interface / type. The first one is named `Event` and its the db model,
 * this is the second one and describes how events are represented in API (and in the frontend)
 */
export type EventAPI = InferAttributes<Event> & {
  tags?: string[],
  place?: InferAttributes<Place>,

  /** true if the owner of the event is the current user */
  is_mine?: boolean,

  /** true if the event does not have an author */
  is_anon?: boolean,

  /** number of moderation messages **/
  n_msgs?: number,

  /** original event's url (useful in case the event is coming from the federation) */
  original_url?: string,

  /** plain text description */
  plain_description?: string

  ap_user?: APUser
}

declare module '#app' {
  interface RuntimeNuxtHooks {
    'cli:start': () => HookResult
  }
  interface NuxtHooks {
    'cli:start': () => HookResult
  }
}

declare module '@nuxt/schema' {
  interface HookKeys {
    'cli:start': string
  }
}

declare module 'nitropack/types' {
  interface NitroRuntimeHooks {
    'cli:start': () => void;
  }
}
