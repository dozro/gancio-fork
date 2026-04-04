import mitt from 'mitt'

export type EventType = {
  'settings:updated': { key: keyof Settings; value: unknown }
}

const emitter = mitt<EventType>()
export default emitter