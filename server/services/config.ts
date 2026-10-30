import { dirname, resolve } from 'path'
import dotenv from 'dotenv'
import fs from 'fs'
import { z } from 'zod'
import { randomBytes } from 'crypto'
import { fileURLToPath } from 'url'
import http from 'node:http'

export const isBuild = process.env.NODE_ENV === 'production'
export const isTest = process.env.VITEST == 'true'

const PortSchema = z.coerce.number().int().positive()

const DialectSchema = z.enum(['sqlite', 'sqlite3', 'mariadb', 'postgresql', 'postgres'])
  .default('sqlite3')
  .transform(t => t === 'sqlite' ? 'sqlite3' : (t === 'postgresql' ? 'postgres' : t))
const LogLevelSchema = z.enum(['fatal', 'error', 'warn', 'warning', 'normal', 'info', 'debug', 'trace']).optional().default('debug')

export const DbSchema = z.object({
  dialect: DialectSchema,
  storage: z.string().transform(absolutizePath).optional(),
  host: z.string().optional(),
  port: PortSchema.optional(),
  user: z.string().optional(),
  password: z.string().optional(),
  database: z.string().optional()
})

export const ConfigSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  baseurl: z.url(),
  server: z.object({
    host: z.string().optional().default('0.0.0.0'),
    port: PortSchema.optional().default(13120)
  }).optional().default({ host: '0.0.0.0', port: 13120 }),
  admin_email: z.string().optional(),
  smtp: z.object({
    host: z.string().optional(),
    port: PortSchema.optional(),
    secure: z.boolean().optional(),
    auth: z.object({
      user: z.string().optional(),
      pass: z.string().optional()
    }).optional()
  }).optional(),
  log_level: LogLevelSchema,
  log_path: z.string().transform(absolutizePath),
  db: DbSchema,
  user_locale: z.string().transform(absolutizePath),
  upload_path: z.string().transform(absolutizePath),
  plugins_path: z.string().transform(absolutizePath),
  hidden_service: z.string().optional().default(''),
  allowed_private_addresses: z.string().optional().default(''),
  session_password: z.string().optional()
})

export type Config = z.infer<typeof ConfigSchema>

let config: Config

/**
 * absolutizes a path relative to cwd (so in configuration I can use relative paths)
 */
export function absolutizePath(path?: string): string {
  if (!path) return ''
  return path.startsWith('/') ? path : resolve(process.env.GANCIO_DATA || process.cwd(), path)
}

/**
 * resolves a path relative to the project root in both build and dev modes
 */
export function runtimeResolve(path: string) {
  return isBuild ? resolve(dirname(fileURLToPath(import.meta.url)), path) : resolve('./server', path)
}

// read the .env
dotenv.config({ quiet: true, path: isTest ? '.env.test' : '.env' })

const dialect = DialectSchema.parse(process.env.GANCIO_DB_DIALECT || 'sqlite3')
const isSqlite = dialect === 'sqlite3'
const db = DbSchema.parse({
  dialect,
  ...(isSqlite && { storage: process.env.GANCIO_DB_STORAGE || 'gancio.sqlite' }),
  ...(!isSqlite && {
    host: process.env.GANCIO_DB_HOST || 'localhost',
    port: process.env.GANCIO_DB_PORT || 3306,
    user: process.env.GANCIO_DB_USERNAME || 'root',
    password: process.env.GANCIO_DB_PASSWORD || '',
    database: process.env.GANCIO_DB_DATABASE || 'gancio'
  })
})

// prepare a default configuration
const defaultConfig: Config = {
  baseurl: process.env.BASEURL || 'http://localhost:13120',
  server: {
    host: process.env.GANCIO_HOST || '0.0.0.0',
    port: Number(process.env.GANCIO_PORT) || 13120
  },
  log_level: process.env.LOG_LEVEL ? LogLevelSchema.parse(process.env.LOG_LEVEL) : 'debug',
  log_path: process.env.LOG_PATH || 'logs',
  db,
  user_locale: process.env.USER_LOCALE || 'user_locale',
  upload_path: process.env.UPLOAD_PATH || 'uploads',
  plugins_path: process.env.PLUGINS_PATH || 'plugins',
  // TODO
  hidden_service: process.env.ALLOW_ACCESS_TO_HIDDEN_SERVICE || '',
  // exceptions to the public address check of outgoing requests, see server/lib/safeFetch.ts
  // while developing allow the local instance (e.g. to import a local ICS)
  allowed_private_addresses: !isBuild && !isTest ? '127.0.0.1:13120,localhost:13120' : process.env.GANCIO_ALLOWED_PRIVATE_ADDRESSES || '',
  admin_email: process.env.ADMIN_EMAIL || '',
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT) || 465,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USERNAME || '',
      pass: process.env.SMTP_PASSWORD || ''
    }
  },
  session_password: process.env.NUXT_SESSION_PASSWORD || process.env.SESSION_PASSWORD
}

type LegacyProxy = { protocol?: string, hostname?: string, host?: string, port?: string | number, auth?: { username?: string, password?: string } }

/**
 * DEPRECATED: to be removed with its call in `get()`.
 * Outgoing requests use the standard HTTP_PROXY / HTTPS_PROXY / NO_PROXY variables with NODE_USE_ENV_PROXY=1,
 * read by node at startup: the legacy `proxy` configuration (`config.json` or PROXY_* variables) is mapped to them.
 */
function setupLegacyProxy(proxy: LegacyProxy = {}) {
  const env = process.env
  const host = proxy.hostname || proxy.host || env.PROXY_HOSTNAME || env.PROXY_HOST
  if (!host || env.NODE_USE_ENV_PROXY === '0') return

  const protocol = (proxy.protocol || env.PROXY_PROTOCOL || 'http').replace(/:$/, '')
  const port = proxy.port || env.PROXY_PORT
  const username = proxy.auth?.username || env.PROXY_AUTH_USERNAME || env.PROXY_USERNAME
  const password = proxy.auth?.password || env.PROXY_AUTH_PASSWORD || env.PROXY_PASSWORD || ''
  const auth = username ? `${encodeURIComponent(username)}:${encodeURIComponent(password)}@` : ''
  const url = `${protocol}://${auth}${host}${port ? `:${port}` : ''}`

  console.warn('The `proxy` configuration (PROXY_* variables) is deprecated: use HTTP_PROXY / HTTPS_PROXY with NODE_USE_ENV_PROXY=1')
  env.HTTP_PROXY ||= url
  env.HTTPS_PROXY ||= url
  env.NODE_USE_ENV_PROXY = '1'
  http.setGlobalProxyFromEnv(env)
}

/**
 * this loads the configuration in `config.json`
 * and merge it with the ENV vars incoming from `.env` or from
 * docker configuration
 */
export function get(): Config {
  if (config) return config

  // read configuration file
  let configuration = {}
  const config_path = absolutizePath(process.env.config_path || (isTest ? `./tests/config.${dialect}.json` : './config.json'))
  if (fs.existsSync(config_path)) {
    console.warn(`Reading configuration from: ${config_path}`)
    const configContent = fs.readFileSync(config_path, 'utf-8')
    configuration = JSON.parse(configContent)
  } else {
    console.warn(`No configuration file found at ${config_path}`)
  }

  try {
    config = ConfigSchema.parse({ ...defaultConfig, ...configuration })
    process.env.NITRO_HOST = config.server.host
    process.env.NITRO_PORT = String(config.server.port)
    setupLegacyProxy((configuration as { proxy?: LegacyProxy }).proxy)
    //
    if (!config.session_password) {
      console.warn('No session password set, generating a random one and saving it to config.json')
      config.session_password = randomBytes(32).toString('hex')
      fs.writeFileSync(config_path, JSON.stringify(config, null, 2))
      return config
    }
    process.env.SESSION_PASSWORD = config.session_password
    return config
  } catch (e) {
    console.error('Configuration error:', e)
    process.exit(-1)
  }
}
