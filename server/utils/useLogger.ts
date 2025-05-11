import { consola } from 'consola'
// consola.withDefaults({ level: LogLevel. })
export function useLogger (tag: string) {
  return consola.withDefaults({ level: 0 }).withTag(tag)
}
// export const log/ger = consola.withTag('server') // optional: tag for consistent prefix
