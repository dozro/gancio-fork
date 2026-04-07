import path from 'path'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { connect, runMigrations } from '../services/db'
import usersCLI from './users'
import settingsCLI from './settings'
import { fileURLToPath } from 'url'
import { spawn } from 'child_process'
import { isBuild } from '../services/config'

import { createRequire } from 'module'
const require = createRequire(import.meta.url)

const { version } = isBuild ? require('./package.json') : require('../../package.json')

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const serverEntry = path.resolve(__dirname, 'index.mjs')
const nodeArgs = [serverEntry]

/**
 * gancio CLI
 */
const yarg = yargs(hideBin(process.argv))
yarg.version(version)
console.info(`📅 Gancio ${version} - A shared agenda for local communities (nodejs: ${process.version})`)

yarg
  .usage('Usage $0 <command> [options]')
  .option('config', {
    alias: 'c',
    describe: 'Configuration file (deprecated!)',
    // default: path.resolve(process.env.cwd, 'config.json'),
    coerce: (config_path) => {
      const absolute_config_path = path.resolve(process.env?.cwd ?? '', config_path)
      process.env.config_path = absolute_config_path
      return absolute_config_path
    }
  })
  .command(['migrate'], 'Run database migration', async () => {
    const db = await connect()
    await runMigrations()
    return db.close()
  })
  .command(['start', 'run', '$0'], 'Start gancio', {}, async () => {
    const child = spawn(process.execPath, nodeArgs, { stdio: 'inherit' })
    child.on('exit', code => process.exit(code))
  })
  .command(['users'], 'Manage users', usersCLI)
  .command(['settings'], 'Manage settings', settingsCLI)
  .help('h')
  .alias('h', 'help')
  .epilog('Made with ❤ by underscore hacklab - https://gancio.org')
  .strict()
  .demandCommand(1, '')
  .recommendCommands()
  .parseAsync()