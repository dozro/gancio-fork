// this script is used to run migrations on the database 
// as we cannot run them directly from nuxt
import { Umzug, SequelizeStorage } from 'umzug'
import { Sequelize } from '@sequelize/core'
import { SqliteDialect} from '@sequelize/sqlite3'
import { MariaDbDialect} from '@sequelize/mariadb'
import dotenv from 'dotenv'

dotenv.config({ quiet: true})

async function main() {
  const dialectMap = {
    sqlite: SqliteDialect,
    sqlite3: SqliteDialect,
    mariadb: MariaDbDialect,
  }
  
  const dialectName = process.env.DB_DIALECT ?? 'sqlite3'
  let dbOptions = {}
  
  if (dialectName === 'mariadb') {
    dbOptions = {
      dialect: dialectMap[dialectName],
      database: process.env.DB_NAME || 'gancio',
      user: process.env.DB_USER || 'gancio',
      password: process.env.DB_PASSWORD || 'gancio',
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
    }
  } else if (dialectName === 'sqlite3' || dialectName === 'sqlite') {
    dbOptions = {
      dialect: dialectMap[dialectName],
      storage: process.env.DB_STORAGE || './gancio.sqlite',
    }
  }

  try {
    const sequelize = new Sequelize(dbOptions)
    try {
      await sequelize.authenticate()
      console.log('Connection has been established successfully.')
    } catch (error) {
      console.error('Unable to connect to the database:', dbOptions, error)
      process.exit(1)
    }
    await runMigrations(sequelize).catch(e => { console.error(e) })
    sequelize.close()
    import('../.output/server/index.mjs')
  } catch (e) {
    console.error('ops', e)
  }
}

async function runMigrations(sequelize) {
  console.error('Running migrations! ', process.cwd())
  const umzug = new Umzug({
      storage: new SequelizeStorage({ sequelize }),
      migrations: { glob: '**/migrations/*.js'},
      context: sequelize.queryInterface,
      logger: console
  })
  await umzug.up()
}

main()
