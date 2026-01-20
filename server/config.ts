import path from 'path'
import dotenv from 'dotenv'
import fs from 'fs'
import { z } from 'zod'

export const ProxyAuthSchema = z.object({
  username: z.string().optional().default(''),
  password: z.string().optional().default(''),
})

export const ProxySchema = z.object({
  protocol: z.string().optional().default(''),
  hostname: z.string().optional().default(''),
  host: z.string().optional().default(''),
  port: z.string().optional().default(''),
  auth: ProxyAuthSchema,
  headers: z.record(z.string(), z.string()).optional().default({}),
})

export type DialectName = 'sqlite3' | 'mariadb' | 'postgresql'
export const DbSchema = z.object({
  dialect: z.enum(['sqlite', 'sqlite3', 'mariadb', 'postgresql'])
    .default('sqlite3')
    .transform(t => t === 'sqlite' ? 'sqlite3' : t),
  storage: z.string().optional(), // sqlite only
  host: z.string().optional(),
  port: z.coerce.number().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  database: z.string().optional(),
})

export const ConfigSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  baseurl: z.string().url(),
  log_level: z.string(),
  log_path: z.string(),
  db: DbSchema,
  user_locale: z.string(),
  upload_path: z.string(),
  plugins_path: z.string(),
  hidden_service: z.string().optional().default(''),
  proxy: ProxySchema,
})

export type Config = z.infer<typeof ConfigSchema>

let config: Config | null = null

/**
 * this loads the configuration using the legacy `config.json`
 * and merge it with the ENV vars incoming from `.env` or from
 * docker configuration
 */
export function get(): Config {
  if (config) return config

  // read the legacy v1 configuration file
  let legacyConfiguration = {}
  const config_path = process.env.config_path || './config.json'
  if (fs.existsSync(config_path)) {
    console.warn(`[WARNING] Configuration from json file will be deprecated!`)
    console.warn(`Reading legacy configuration from: ${config_path}`)
    const configContent = fs.readFileSync(config_path, 'utf-8')
    legacyConfiguration = JSON.parse(configContent)
  }

  // read the .env
  dotenv.config({ quiet: true })
  if (!process.env.NUXT_SESSION_PASSWORD) {
    console.error('NUXT_SESSION_PASSWORD cannot be empty (check your .env)!')
    process.exit(-1)
  }

  const defaultConfig = {
    baseurl: process.env.BASE_URL || 'http://localhost:13120',
    log_level: process.env.LOG_LEVEL || 'debug',
    log_path: path.resolve(process.env.LOG_PATH || '', 'logs'),
    db: {
      dialect: (process.env.DB_DIALECT || 'sqlite3') as DialectName,
      storage: process.env.DB_STORAGE || 'gancio.sqlite'
    },
    user_locale: path.resolve(process.env.USER_LOCALE || 'user_locale'),
    upload_path: path.resolve(process.env.UPLOAD_PATH || 'uploads'),
    plugins_path: path.resolve(process.env.PLUGINS_PATH || 'plugins'),
    // TODO
    hidden_service: process.env.ALLOW_ACCESS_TO_HIDDEN_SERVICE || '',
    // TODO
    proxy: {
      protocol: process.env.PROXY_PROTOCOL || '',
      hostname: process.env.PROXY_HOSTNAME || '',
      host: process.env.PROXY_HOST || '',
      port: process.env.PROXY_PORT || '',
      auth: {
        username: process.env.PROXY_USERNAME || '',
        password: process.env.PROXY_PASSWORD || ''
      },
      headers: process.env.PROXY_HEADERS && JSON.parse(process.env.PROXY_HEADERS) || {}
    }
  }

  // TODO: check is this is working as expected
  config = Object.assign(legacyConfiguration, defaultConfig)
  config = ConfigSchema.parse(config)
  return config
}
