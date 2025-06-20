import { consola, LogLevels } from 'consola'
export function useLogger (tag: string) {
  return consola.withDefaults({ level: LogLevels.debug }).withTag(tag)
}
