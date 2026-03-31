import pkg from '../../package.json' with { type: 'json' }
import path from 'path'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import usersCLI from './users'

/**
 * parse cli command
 */
  const yarg = yargs(hideBin(process.argv))
  yarg.version(pkg.version)
  console.info(`📅 ${pkg.name} - v${pkg.version} - A shared agenda for local communities (nodejs: ${process.version})`)

  await yarg
    .usage('Usage $0 <command> [options]')
    .option('config', {
      alias: 'c',
      describe: 'Configuration file (deprecated!)',
      // default: path.resolve(process.env.cwd, 'config.json'),
      coerce: (config_path) => {
        const absolute_config_path = path.resolve(process.env.cwd, config_path)
        process.env.config_path = absolute_config_path
        return absolute_config_path
      }
    })
    // .command(['migrate'], 'Run database migration', migrate)
    .command(['start', 'run', '$0'], 'Start gancio', {}, async () => {
      try {
        await import('nuxt/server/index.mjs')
      } catch (e) {
        console.error(e)
      }
    })
    .command(['users'], 'Manage users', usersCLI)
    // .command(['settings'], 'Manage settings', settingsCLI)
    .help('h')
    .alias('h', 'help')
    .epilog('Made with ❤ by underscore hacklab - https://gancio.org')
    .strict()
    .demandCommand(1, '')
    .recommendCommands()
    .parseAsync()
  