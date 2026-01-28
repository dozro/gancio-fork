import pkg from '../../package.json' with { type: 'json' }
import path from 'path'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import usersCLI from './users.js'

/**
 * parse cli command
 */
export async function parseCLI(start: () => void) {
  // teleport myself to the correct position
  // process.env.cwd = process.env.GANCIO_DATA || path.resolve('./')
  // const __dirname = path.dirname(new URL(import.meta.url).pathname)
  // process.chdir(path.resolve(__dirname))
  const yarg = yargs(hideBin(process.argv))
  yarg.version(pkg.version)
  console.info(`📅 ${pkg.name} - v${pkg.version} - A shared agenda for local communities (nodejs: ${process.version})`)
  // yarg.exitProcess(false) // ← prevent yargs from exiting

  const argv = await yarg
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
    .command(['start', 'run', '$0'], 'Start gancio', {}, () => start())
    .command(['users'], 'Manage users', usersCLI)
    // .command(['settings'], 'Manage settings', settingsCLI)
    .help('h')
    .alias('h', 'help')
    .epilog('Made with ❤ by underscore hacklab - https://gancio.org')
    .strict()
    .demandCommand(1, '')
    .recommendCommands()
    .parse()

  if ((!argv.version && !argv.help) && (argv._.length === 0 || ['start', 'run'].includes(argv._[0]))) {
    return true
  } else {
    process.exit(-1)
  }
}
