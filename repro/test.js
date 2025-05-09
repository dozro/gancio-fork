import { Umzug, SequelizeStorage } from 'umzug'
import { Sequelize } from "@sequelize/core"


export async function connect() {
    console.error('connect!')
    const sequelize = new Sequelize({
        dialect: 'sqlite3',
        storage: 'test.sqlite'
    })
    await sequelize.authenticate()
    await runMigrations(sequelize).catch(e => { console.error(e)})
    // await sequelize.addModels([Announcement, Place, Event, Tag, User, Instance, APUser, Setting, Collection]);
    return sequelize
}

export async function runMigrations(sequelize) {
    const umzug = new Umzug({
        storage: new SequelizeStorage({ sequelize }),
        migrations: { glob: './migrations/*.js'},
        context: sequelize.queryInterface,
        logger: console
    })
    await umzug.up()
}

connect()
