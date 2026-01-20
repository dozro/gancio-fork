import { consola } from 'consola'

export function useLogger(tag: string = 'app') {
  const logger = consola.withDefaults({
    level: 10, // Enable all logs, including debug and trace
  })
    .withTag(tag)

  logger.level = 10
  return logger
}
