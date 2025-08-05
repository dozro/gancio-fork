#!/usr/bin/env node
/** 
 * This will work in dev and prod
*/

import pkg from './package.json'  with { type: 'json' }
import path from 'path'
import yargs from 'yargs'
import dotenv from 'dotenv'
import { hideBin } from 'yargs/helpers'
import usersCLI from './cli/users.js'
// import settingsCLI from './cli/settings.js'

// reset .env e load into process.env
dotenv.config()

const yarg = yargs(hideBin(process.argv))
yarg.version(pkg.version)

// teleport myself to the correct position
// process.env.cwd = process.env.GANCIO_DATA || path.resolve('./')
// const __dirname = path.dirname(new URL(import.meta.url).pathname)
// process.chdir(path.resolve(__dirname, '..'))


// set NUXT & NITRO environment

async function start () {
  return import('./index').catch(e => {
    console.error(e)
    process.exit(2)
  })
}

export async function getSequelize () {
  if (process.env.NODE_ENV === 'dev') {
    const sequelize = await import("./server/utils/sequelize.ts")
    await sequelize.connect()
    return sequelize
  } else {
    const { sequelize } = await import("../chunks/nitro/nitro.mjs")
    await sequelize.connect()
    return sequelize
  }
}

async function migrate () {
  if (config.status  === 'SETUP') {
    console.error('> Cannot run database migration before setup')
    return
  }
  const sequelize = await getSequelize()
  await sequelize.runMigrations()
}

console.info(`📅 ${pkg.name} - v${pkg.version} - ${pkg.description} (nodejs: ${process.version})`)

yarg
  .usage('Usage $0 <command> [options]')
  .option('config', {
    alias: 'c',
    describe: 'Configuration file',
    // default: path.resolve(process.env.cwd, 'config.json'),
    coerce: config_path => {
      const absolute_config_path = path.resolve(process.env.cwd, config_path)
      process.env.config_path = absolute_config_path
      console.error(process.env.config_path)
      return absolute_config_path
    }})
  .command(['migrate'], 'Run database migration', migrate)
  .command(['start', 'run', '$0'], 'Start gancio', {}, start)
  .command(['users'], 'Manage users', usersCLI)
  // .command(['settings'], 'Manage settings', settingsCLI)
  .help('h')
  .alias('h', 'help')
  .epilog('Made with ❤ by underscore hacklab - https://gancio.org')
  .recommendCommands()
  .demandCommand(1, '')
  .argv
