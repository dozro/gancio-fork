import pkg from '../../package.json'  with { type: 'json' }
import path from 'path'
import yargs from 'yargs'
import dotenv from 'dotenv'
import { hideBin } from 'yargs/helpers'
import usersCLI from '../cli/users.js'
import type { NitroApp } from 'nitropack'


export function main(nitro: NitroApp) {
  // read .env
  // dotenv.config({ quiet: true })
  
  // teleport myself to the correct position
  // process.env.cwd = process.env.GANCIO_DATA || path.resolve('./')
  // const __dirname = path.dirname(new URL(import.meta.url).pathname)
  // process.chdir(path.resolve(__dirname))
  
  const yarg = yargs(hideBin(process.argv))
  yarg.version(pkg.version)
  console.info(`📅 ${pkg.name} - v${pkg.version} - A shared agenda for local communities (nodejs: ${process.version})`)
  
  return yarg
    .usage('Usage $0 <command> [options]')
    .option('config', {
      alias: 'c',
      describe: 'Configuration file',
      // default: path.resolve(process.env.cwd, 'config.json'),
      coerce: config_path => {
        const absolute_config_path = path.resolve(process.env.cwd, config_path)
        process.env.config_path = absolute_config_path
        return absolute_config_path
      }
    })
    // .command(['migrate'], 'Run database migration', migrate)
    .command(['start', 'run', '$0'], 'Start gancio', {}, () => nitro.hooks.callHook('cli:start'))
    .command(['users'], 'Manage users', usersCLI)
    // .command(['settings'], 'Manage settings', settingsCLI)
    .help('h')
    .alias('h', 'help')
    .epilog('Made with ❤ by underscore hacklab - https://gancio.org')
    .strict()
    .fail((msg, err, yargs) => {
      console.error('error:', msg || err?.message)
      console.log(yargs.help())
      process.exit(1)
    })
    .recommendCommands()
    .demandCommand(1, '')
    .argv
}