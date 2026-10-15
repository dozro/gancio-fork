import type { FetchError } from 'ofetch'
import type { Emitter, EventType, Handler } from 'mitt'

export {}
type Events = Record<EventType, unknown>
type MittEmitter = Emitter<Events>

declare module '#app' {
  interface NuxtApp {
    $confirm: (msg: string, args?: object) => Promise<unknown>
    $notify: (
      msg: string | FetchError | unknown,
      status?: Statuses,
      args?: object
    ) => void
    $prompt: (
      msg: string,
      title: string,
      label?: string,
      value?: string
    ) => Promise<unknown>
    $on: MittEmitter['on']
    $emit: MittEmitter['emit']
    $emitt: MittEmitter['emit']
    $once: (
      type: EventType,
      handler: Handler<unknown>
    ) => void
  }
}
