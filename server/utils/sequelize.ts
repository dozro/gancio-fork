  import bcrypt from 'bcrypt'
import crypto from 'crypto'
import slugify from 'slugify'
import { Umzug, SequelizeStorage } from 'umzug'
import { useLogger } from './useLogger'

import {
    Sequelize,
    DataTypes,
    Op,
    Model,
    type InferAttributes,
    type InferCreationAttributes,
    type CreationOptional,
    type NonAttribute,
} from "@sequelize/core"

import {
    Attribute,
    HasMany,
    NotNull,
    Table,
    Scopes,
    CreatedAt,
    UpdatedAt,
    PrimaryKey,
    AutoIncrement,
    // BeforeCreate,
    // BeforeUpsert,
    Index,
    Unique,
    BeforeSave,
    // AllowNull,
    BelongsToMany,
    // BelongsTo,
    Default,
    BeforeValidate,
    BeforeCreate,
    BelongsTo
} from "@sequelize/core/decorators-legacy"

import { SqliteDialect } from "@sequelize/sqlite3"
import { SecretSettings, Settings } from './settings'

const log = useLogger('sequelize')
//   import bcrypt from "bcrypt";
// const environment = process.env.NODE_ENV || "development";

//   const options = config[environment as keyof typeof config];
//   export const sequelize = new Sequelize({
//     ...options,
//   } as Options<SqliteDialect>);
let config
if (typeof useRuntimeConfig === 'function') {
  config = useRuntimeConfig()
} else {
  config = await import('../config.js')
}

export let sequelize: Sequelize | undefined
export async function connect() {
  log.info('connect')
  if (sequelize) { return sequelize }
  log.info('connect')
  sequelize = new Sequelize({
      dialect: SqliteDialect || config?.db_dialect,
      storage: config?.db_storage ?? './gancio.sqlite'
  })
  await sequelize.authenticate()
  await runMigrations(sequelize).catch(e => { console.error(e)})
  sequelize.addModels([Announcement, Place, Event, Tag, User, Instance, APUser, Setting, Collection, Filter, Resource, Page, Notification, Message])

  User.addScope('defaultScope', { attributes: { exclude: ['password', 'recover_code'] } })
  User.addScope('withPassword', { })

  return sequelize
}

export async function runMigrations(sequelize: Sequelize) {
  log.warn('running migrations!')
    const umzug = new Umzug({
        storage: new SequelizeStorage({ sequelize }),
        migrations: { glob: './server/migrations/*.js'},
        context: sequelize.queryInterface,
        logger: console
    })
    await umzug.up()
}

@Table({
    tableName: 'announcements',
})
export class Announcement extends Model<
InferAttributes<Announcement>,
InferCreationAttributes<Announcement>
> {
    @Attribute(DataTypes.INTEGER.UNSIGNED)
    @PrimaryKey
    @AutoIncrement
    declare readonly id: CreationOptional<number>;
    
    @Attribute(DataTypes.STRING)
    @NotNull
    declare title: string;
    
    @Attribute(DataTypes.STRING)
    declare announcement: string;
    
    @Attribute(DataTypes.BOOLEAN)
    declare visible: string;
    
}

@Table({
    tableName: 'messages'
})
export class Message extends Model<
  InferAttributes<Message>,
  InferCreationAttributes<Message>
> {
    @Attribute(DataTypes.INTEGER)
    @PrimaryKey
    @AutoIncrement
    declare id: CreationOptional<number>

    @Attribute(DataTypes.TEXT)
    @NotNull
    declare message: string

    @Attribute(DataTypes.ENUM(['AUTHOR', 'ADMIN', 'ANON', 'REGISTERED']))
    declare author: 'AUTHOR' | 'ADMIN' | 'ANON' | 'REGISTERED'

    @Attribute(DataTypes.BOOLEAN)
    declare is_author_visible: boolean // is this message visible to the author?
    
    @Attribute({
        type: DataTypes.INTEGER.UNSIGNED,
        references: { table: "events", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
    })
    declare eventId: number

    @BelongsTo(() => Event, { foreignKey: 'eventId', targetKey: 'id' })
    declare event: NonAttribute<Event>
}


@Table({
    tableName: 'events'
})
export class Event extends Model<
InferAttributes<Event>,
InferCreationAttributes<Event>
> {
    @Attribute(DataTypes.INTEGER.UNSIGNED)
    @PrimaryKey
    @AutoIncrement
    declare readonly id: CreationOptional<number>
    
    /**  title of the event */
    @Attribute(DataTypes.STRING)
    @NotNull
    declare title: string
    
    @Attribute(DataTypes.STRING)
    @Index
    @Unique
    declare slug: string
    
    @Attribute(DataTypes.INTEGER.UNSIGNED)
    @Index
    declare start_datetime: number
    
    @Attribute(DataTypes.INTEGER.UNSIGNED)
    @Index
    declare end_datetime: number
    
    @Attribute(DataTypes.JSON)
    declare media: string
    
    @Attribute(DataTypes.TEXT)
    declare description: string
    
    @Attribute(DataTypes.BOOLEAN)
    declare is_visible: boolean
    
    @Attribute(DataTypes.JSON)
    declare online_locations: string
    
    @Attribute({
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        references: { table: "events", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
    })
    declare parentId: number | null

    @BelongsTo(() => Event, { foreignKey: 'parentId', targetKey: 'id' })
    declare parent?: NonAttribute<Event>
    
    @Attribute({
        type: DataTypes.INTEGER.UNSIGNED,
        references: { table: "places", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
    })
    declare placeId: number;
    
    @BelongsTo(() => Place, { foreignKey: 'placeId' })
    declare place?: NonAttribute<Place>
    
    @BelongsToMany(() => Tag, { through: 'event_tags', inverse: { as: 'events' } })
    declare tags?: NonAttribute<Tag[]>

    @Attribute({
        type: DataTypes.STRING,
        references: { table: "ap_users", key: "ap_id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
    })
    declare apUserApId: string;

    @BelongsTo(() => APUser, { foreignKey: 'apUserApId', targetKey: 'ap_id' })
    declare apUser?: NonAttribute<APUser>
    
    @HasMany(() => Message, { foreignKey: 'eventId', sourceKey: 'id' })
    declare messages?: NonAttribute<Message[]>
    
    @BeforeCreate
    static async generateSlug(event: Event) {
      if (event.title && !event.slug) {
        let baseSlug = slugify(event.title, { lower: true, strict: true })
        let slug = baseSlug
        let count = 1
  
        // Ensure slug is unique
        while (
          await Event.findOne({
            where: {
              slug,
              id: { [Op.ne]: event.id }, // skip self in case of update
            },
          })
        ) {
          slug = `${baseSlug}-${count++}`
        }
  
        event.slug = slug
      }
    }    
}

@Table({
    tableName: 'tags'
})
export class Tag extends Model<
InferAttributes<Tag>,
InferCreationAttributes<Tag>
> {
    @Attribute(DataTypes.STRING)
    @PrimaryKey
    @Index
    @Unique
    declare tag: string;
    
    // @BelongsToMany(() => Event, { through: 'event_tags' })
    declare events?: NonAttribute<Event[]>
}

@Table({
    tableName: 'places'
})
export class Place extends Model<
InferAttributes<Place>,
InferCreationAttributes<Place>
> {
    @Attribute(DataTypes.INTEGER.UNSIGNED)
    @PrimaryKey
    @AutoIncrement
    declare readonly id: CreationOptional<number>;
    
    @Attribute(DataTypes.STRING)
    @Index
    @Unique
    @NotNull
    declare name: string;
    
    @Attribute(DataTypes.STRING)
    declare address: string;
    
    @Attribute(DataTypes.FLOAT)
    declare latitude: number;
    
    @Attribute(DataTypes.FLOAT)
    declare longitude: number;
    
    @HasMany(() => Event, /* foreign key */ 'placeId')
    declare events?: NonAttribute<Event[]>;
    
}

type Role = "admin" | "editor" | "user"

@Table({
    tableName: "users"
})
export class User extends Model<
InferAttributes<User>,
InferCreationAttributes<User>
> {
    @Attribute(DataTypes.INTEGER.UNSIGNED)
    @PrimaryKey
    @AutoIncrement
    declare readonly id: CreationOptional<number>;
    
    @Attribute(DataTypes.STRING)
    declare display_name: string;
    
    @Attribute(DataTypes.STRING)
    @NotNull
    @Index
    @Unique({
      name: 'unique_mail',
      msg: 'error.email_taken'
    })
    declare email: string;
    
    @Attribute(DataTypes.STRING)
    declare password: string
    
    @Attribute(DataTypes.STRING)
    declare recover_code: string
    
    @Attribute(DataTypes.BOOLEAN)
    declare is_active: boolean
    
    @Attribute(DataTypes.BOOLEAN)
    @Default(true)
    declare to_notify: boolean
    
    @Attribute(DataTypes.STRING)
    declare description: string
    
    @Attribute(DataTypes.ENUM(['admin', 'editor', 'user']))
    declare role: Role
    
    
    @CreatedAt
    declare readonly createdAt: CreationOptional<Date>
    
    @UpdatedAt
    declare readonly updatedAt: CreationOptional<Date>
    
    async generateRecoverCode() {
      this.recover_code = crypto.randomUUID()
      await this.save()
    }
    
    async comparePassword(pwd: string) {
      if (!this.password) { return false }
      return bcrypt.compare(pwd, this.password)
    }
    
    @BeforeSave
    static async hashPassword(instance: User) {
      if (instance.changed('password')) {
        const password = instance.getDataValue('password')
        if (password) {
          const hashedPassword = bcrypt.hashSync(password, 10)
          instance.setDataValue("password", hashedPassword)
        }
      }
    }
}

@Table({
    tableName: 'instances'
})
export class Instance extends Model<
InferAttributes<Instance>,
InferCreationAttributes<Instance>
> {
    @Attribute(DataTypes.STRING)
    @PrimaryKey
    declare domain: string
    
    @Attribute(DataTypes.STRING)
    declare name: string
    
    @Attribute(DataTypes.BOOLEAN)
    declare blocked: boolean
    
    @Attribute(DataTypes.JSON)
    declare data: string;
    
    @Attribute(DataTypes.STRING)
    declare applicationActor?: string
    
    @HasMany(() => APUser, { foreignKey: 'instanceDomain', sourceKey: 'domain' })
    declare apUsers?: NonAttribute<APUser[]>
    
    // @HasMany(() => Event, /* foreign key */ 'placeId')
    // declare events?: NonAttribute<Event[]>;
    
}


type APUserObject = {
    name: string,
    icon: { url: string },
    summary?: string,
    preferredUsername: string,
    url?: string
}

@Table({
    tableName: 'ap_users'
})
export class APUser extends Model<
InferAttributes<APUser>,
InferCreationAttributes<APUser>
> {
    @Attribute(DataTypes.STRING)
    @PrimaryKey
    declare ap_id: string
    
    @Attribute(DataTypes.BOOLEAN)
    declare follower: boolean
    
    @Attribute(DataTypes.BOOLEAN)
    declare following: boolean
    
    @Attribute(DataTypes.BOOLEAN)
    declare trusted: boolean
    
    @Attribute(DataTypes.BOOLEAN)
    declare blocked: boolean
    
    @Attribute(DataTypes.JSON)
    declare object: APUserObject;
    
    @Attribute({
        type: DataTypes.STRING,
        references: { table: "instances", key: "domain" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
    })
    declare instanceDomain: string

    @BelongsTo(() => Instance, { foreignKey: 'instanceDomain', targetKey: 'domain' })
    declare instance?: NonAttribute<Instance>
    
    @HasMany(() => Event, { foreignKey: 'apUserApId', sourceKey: 'ap_id' })
    declare events?: NonAttribute<Event[]>
    
    @HasMany(() => Resource, { foreignKey: 'activitypub_id', sourceKey: 'ap_id' })
    declare resources?: NonAttribute<Resource[]>
    
}

@Table({
    tableName: 'settings'
})
export class Setting extends Model<
InferAttributes<Setting>,
InferCreationAttributes<Setting>
> {
    @Attribute(DataTypes.STRING)
    @PrimaryKey
    declare key: keyof Settings | keyof SecretSettings
    
    @Attribute(DataTypes.JSON)
    declare value: string | number | boolean | object | null
    
    @Attribute(DataTypes.BOOLEAN)
    @Default(false)
    declare is_secret: boolean
    
    @CreatedAt
    declare readonly createdAt: CreationOptional<Date>
    
    @UpdatedAt
    declare readonly updatedAt: CreationOptional<Date>
}

@Table({
    tableName: 'collections',
    timestamps: false
})
export class Collection extends Model<
InferAttributes<Collection>,
InferCreationAttributes<Collection>
> {
    
    @Attribute(DataTypes.INTEGER.UNSIGNED)
    @PrimaryKey
    @AutoIncrement
    declare readonly id: CreationOptional<number>
    
    @Attribute(DataTypes.STRING)
    @Unique
    @Index
    @NotNull
    declare name: string
    
    @Attribute(DataTypes.BOOLEAN) // not used yet
    declare isActor: boolean
    
    @Attribute(DataTypes.BOOLEAN) // is this collection shown in the home page navbar? //TODO: rename in showInNavBar or showInHome?
    declare isTop: boolean
    
}

@Table({
  tableName: 'filters',
  timestamps: false,
  indexes: [
    { fields: ['collectionId', 'tags', 'places', 'actors'], unique: true }
  ]
})
export class Filter extends Model<
  InferAttributes<Filter>,
  InferCreationAttributes<Filter>
> {
  @Attribute(DataTypes.INTEGER)
  @PrimaryKey
  @AutoIncrement
  declare id: CreationOptional<number>

  @Attribute(DataTypes.BOOLEAN)
  declare negate: boolean;

  @Attribute(DataTypes.JSON)
  declare tags: any

  @Attribute(DataTypes.JSON)
  declare places: any

  @Attribute(DataTypes.JSON)
  declare actors: any

  // If collectionId is a foreign key, you may want to add:
  @Attribute(DataTypes.INTEGER)
  declare collectionId: number
  
}


@Table({
    tableName: 'resources',
    timestamps: false
})
export class Resource extends Model<
InferAttributes<Resource>,
InferCreationAttributes<Resource>
> {
    
    @Attribute(DataTypes.STRING)
    @PrimaryKey
    declare activitypub_id: string
    
    @Attribute(DataTypes.BOOLEAN)
    declare hidden: boolean
    
    @Attribute(DataTypes.JSON)
    declare data: any // @todo
    
    @Attribute({
        type: DataTypes.STRING,
        references: { table: "ap_users", key: "ap_id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
    })
    declare apUserApId: string

    @BelongsTo(() => APUser, { foreignKey: 'apUserApId', targetKey: 'ap_id' })
    declare apUser?: NonAttribute<APUser>
}

@Table({
    tableName: 'pages',
    timestamps: false
})
export class Page extends Model<
InferAttributes<Page>,
InferCreationAttributes<Page>
> {
    @Attribute(DataTypes.INTEGER.UNSIGNED)
    @PrimaryKey
    @AutoIncrement
    declare readonly id: CreationOptional<number>

    @Attribute(DataTypes.STRING)
    declare title: string
    
    @Attribute(DataTypes.TEXT)
    declare content: string


    @Attribute(DataTypes.BOOLEAN)
    declare visible: boolean
    
    @Attribute(DataTypes.STRING)
    @Index
    @Unique
    declare slug: string
}

export const NotificationActionEnum = ['Create', 'Update', 'Delete'] as const
export type NotificationAction = typeof NotificationActionEnum[number]

export const NotificationTypeEnum = ['mail', 'admin_email', 'ap'] as const
export type NotificationType = typeof NotificationTypeEnum[number]

@Table({
  tableName: 'notifications',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['action', 'type']
    }
  ]
})
export class Notification extends Model<
    InferAttributes<Notification>,
    InferCreationAttributes<Notification>
> {
    @Attribute(DataTypes.JSON)
    declare filters: any

    @Attribute(DataTypes.STRING)
    declare email: string

    @Attribute(DataTypes.STRING)
    declare remove_code: string

    @Attribute(DataTypes.ENUM(...NotificationActionEnum))
    declare action: NotificationAction

    @Attribute(DataTypes.ENUM(...NotificationTypeEnum))
    declare type: NotificationType
}