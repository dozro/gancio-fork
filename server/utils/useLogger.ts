import { consola } from 'consola'

export function useLogger (tag: string) {
  return consola.withTag(tag)
}
// export const log/ger = consola.withTag('server') // optional: tag for consistent prefix

