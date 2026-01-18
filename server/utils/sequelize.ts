import bcrypt from 'bcrypt'
import crypto from 'crypto'
import slugify from 'slugify'
import { Umzug, SequelizeStorage } from 'umzug'
import fs from 'fs/promises'
import path from 'path'
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
  type InferAttributesOptions,
  type AbstractDialect,
  type Options,
  BelongsToManySetAssociationsMixin,
  BelongsToSetAssociationMixin,
  AggregateOptions,
} from "@sequelize/core"

import {
  Attribute,
  HasMany,
  NotNull,
  Table,
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
  BeforeCreate,
  BelongsTo,
  BeforeDestroy
} from "@sequelize/core/decorators-legacy"

import type { SecretSettings, Settings } from './settings'

import { DateTime } from 'luxon'
import { get as getConfig } from '../config'
import { getThumbnailsPath } from './directories'
const config = getConfig()
const log = useLogger('sequelize')

export let sequelize: Sequelize | undefined

export async function connect() {
  if (sequelize) { return sequelize }
  if ('sqlite3' === config.db.dialect) {
    log.info(`Connecting to sqlite db ${config.db.storage}`)
  } else {
    log.info(`Connecting to ${config.db.dialect} host: ${config.db.host}:${config.db.port} database: ${config.db.database}`)
  }

  try {
    sequelize = new Sequelize(config.db as Options<AbstractDialect>)
    await sequelize.authenticate()
    log.info('Connection has been established successfully.')
    sequelize.addModels([Announcement, Place, Event, Tag, User, Instance, APUser, Setting, Collection, Filter, Resource, Page, Notification, Message])
  } catch (error) {
    console.error('Unable to connect to the database:', config.db, error)
    process.exit(1)
  }

  User.addScope('defaultScope', { attributes: { exclude: ['password', 'recover_code'] } })
  User.addScope('withRecoverCode', { attributes: { exclude: ['password'] } })
  User.addScope('withPassword', {})

  return sequelize
}

export async function runMigrations() {
  if (!sequelize) return
  const umzug = new Umzug({
    storage: new SequelizeStorage({ sequelize }),
    migrations: { glob: '**/migrations/*.js' },
    context: sequelize.queryInterface,
    logger: console
  })
  try {
    await umzug.up()
  } catch (e) {
    log.error("Error running migrations ", e)
    throw e
  }
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
  declare readonly id: CreationOptional<number>

  @CreatedAt
  declare readonly createdAt: CreationOptional<Date>

  @UpdatedAt
  declare readonly updatedAt: CreationOptional<Date>

  @Attribute(DataTypes.STRING)
  @NotNull
  declare title: string

  @Attribute(DataTypes.STRING)
  declare announcement: string

  @Attribute(DataTypes.BOOLEAN)
  declare visible: boolean
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

export interface Media {
  /** use as alt attribute */
  name?: string,
  url?: string,
  height?: number,
  width?: number,
  size?: number,
  image?: string | Blob | File,

  /** https://docs-p.joinmastodon.org/spec/activitypub/#focalPoint */
  focalpoint?: [number, number]
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

  @CreatedAt
  declare readonly createdAt: CreationOptional<Date>

  @UpdatedAt
  declare readonly updatedAt: CreationOptional<Date>

  /**  title of the event */
  @Attribute(DataTypes.STRING)
  @NotNull
  declare title: string

  @Attribute(DataTypes.STRING)
  @Index
  @Unique
  declare slug: CreationOptional<string>

  @Attribute(DataTypes.INTEGER.UNSIGNED)
  @Index
  declare start_datetime: number

  @Attribute(DataTypes.INTEGER.UNSIGNED)
  @Index
  declare end_datetime?: number

  @Attribute(DataTypes.JSON)
  @Default([])
  declare media: Media[]

  @Attribute(DataTypes.TEXT)
  declare description: string

  @Attribute(DataTypes.BOOLEAN)
  declare is_visible: boolean

  @Attribute(DataTypes.JSON)
  declare online_locations?: Array<string>

  @Attribute(DataTypes.JSON)
  declare recurrent?: object | null

  @Attribute(DataTypes.JSON)
  declare ap_object?: { url?: string, attributedTo?: string }

  @Attribute(DataTypes.JSON)
  declare likes?: Array<object>

  @Attribute(DataTypes.JSON)
  boost?: Array<object>

  /** represent the AP URI */
  @Attribute(DataTypes.STRING)
  @Index
  declare ap_id?: string

  @Attribute({
    type: DataTypes.INTEGER.UNSIGNED,
    references: { table: "users", key: "id" },
    onUpdate: "CASCADE",
    onDelete: "SET NULL",
  })
  declare userId?: number;

  @BelongsTo(() => User, { foreignKey: 'userId', targetKey: 'id' })
  declare user?: NonAttribute<User>

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
  declare placeId: number

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
  declare apUserApId?: string

  @BelongsTo(() => APUser, { foreignKey: 'apUserApId', targetKey: 'ap_id' })
  declare APUser?: NonAttribute<APUser>

  @HasMany(() => Message, { foreignKey: 'eventId', sourceKey: 'id' })
  declare messages?: NonAttribute<Message[]>

  @HasMany(() => Resource, { foreignKey: 'eventId', sourceKey: 'id' })
  declare resources?: NonAttribute<Resource[]>

  // the mixins Sequelize automatically provides
  declare setTags: BelongsToManySetAssociationsMixin<Tag, string>
  declare setPlace: BelongsToSetAssociationMixin<Place, number>

  @BeforeDestroy
  static async removeImg (instance: Event) {
    // remove the image files (normal and thumb) associated with this event
    // if no image is associated, do nothing
    if (!instance.media || instance.media.length === 0 || !instance.media[0]?.url) { return }
    for (let media of instance.media) {
      if (!media?.url) continue
      const thumbPath = path.resolve(getThumbnailsPath(config), path.basename(media.url))
      const normalPath = path.resolve(config.upload_path, path.basename(media.url))
      log.info(`Removing event images for event ${instance.id}: `, normalPath, thumbPath)
      await Promise.allSettled([
        fs.unlink(normalPath),
        fs.unlink(thumbPath)
      ])
    }
  }
  
  @BeforeCreate
  static async generateSlug(event: Event) {
    if (event.title && !event.slug) {
      const baseSlug = slugify(event.title, { lower: true, strict: true })
      let slug = baseSlug
      let count = 1

      // Ensure slug is unique
      while (
        await Event.findOne({
          where: { slug, id: { [Op.ne]: event.id } }
        }) // skip self in case of update
      ) {
        slug = `${baseSlug}-${count++}`
      }

      event.slug = slug
    }
  }

  toAP() {

    const username = publicSettings.instance_name
    const opt = {
      zone: publicSettings.instance_timezone,
      locale: publicSettings.instance_locale
    }

    const datetime = DateTime.fromSeconds(this.start_datetime, opt).toLocaleString({ weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })

    // https://framagit.org/les/gancio/-/issues/304
    // https://www.w3.org/TR/activitystreams-vocabulary/#dfn-summary
    const summary = `<p>${this.place && this.place.name}, ${datetime}</p>${this.description}`

    let attachment: object[] = []
    let location: object[] = []

    if (this?.online_locations?.length) {
      location = this.online_locations.map(url => ({
        type: 'VirtualLocation',
        url
      }))
      attachment = this.online_locations.map(href => ({
        type: 'Link',
        mediaType: 'text/html',
        name: href,
        href
      }))
    }

    if (this.place?.name !== 'online') {
      location.push(this.place?.toAP())
    }

    // in case we only have a single location (the common case) do not use an array to simplify federation parser
    if (location.length === 1) {
      location = location[0]
    }

    if (this?.media?.length) {
      attachment.push({
        type: 'Document',
        mediaType: 'image/jpeg',
        url: `${config.baseurl}/media/${this.media[0].url}`,
        name: this.media[0].name || this.title || '',
        focalPoint: this.media[0].focalpoint || [0, 0]
      })
    }

    let tags = this.tags?.map(tag => tag.tag) ?? []

    // add default fedi hashtags if needed on local events only
    if (!this.ap_id && publicSettings.default_fedi_hashtags.length) {
      tags = [...new Set([...tags, ...publicSettings.default_fedi_hashtags])]
    }

    const tag = tags?.map(tag => ({
      type: 'Hashtag',
      name: '#' + tag,
      href: `${publicSettings.baseurl}/tag/${encodeURIComponent(tag)}`
    })) ?? []

    return {
      id: this.ap_id ?? `${publicSettings.baseurl}/federation/m/${this.id}`,
      name: this.title,
      url: this?.ap_object?.url ?? this?.ap_object?.id ?? `${publicSettings.baseurl}/event/${this.slug || this.id}`,
      type: 'Event',
      startTime: DateTime.fromSeconds(this.start_datetime, opt).toISO(),
      ...(this.end_datetime ? { endTime: DateTime.fromSeconds(this.end_datetime, opt).toISO() } : {}),
      location,
      attachment,
      tag,
      published: this.updatedAt,
      updated: this.updatedAt,
      attributedTo: this.ap_object?.attributedTo ?? `${publicSettings.baseurl}/federation/u/${username}`,
      to: ['https://www.w3.org/ns/activitystreams#Public'],
      cc: this.ap_object?.cc ?? [`${publicSettings.baseurl}/federation/u/${username}/followers`],
      content: this.description || '',
      summary
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
  declare name: string

  @Attribute(DataTypes.STRING)
  @Index
  declare ap_id?: string

  @Attribute(DataTypes.STRING)
  declare address: string

  @Attribute(DataTypes.DOUBLE)
  declare latitude?: number

  @Attribute(DataTypes.DOUBLE)
  declare longitude?: number

  @HasMany(() => Event, /* foreign key */ 'placeId')
  declare events?: NonAttribute<Event[]>

  /**
   * @returns ActivityStream location representation
   * @link https://www.w3.org/TR/activitystreams-vocabulary/#places
   * @todo support PostalAddress type
   * @link WIP -> https://codeberg.org/fediverse/fep/src/commit/4a75a1bc50bc6d19fc1e6112f02c52621bc178fe/fep/8a8e/fep-8a8e.md#location
   */
  toAP() {
    return {
      id: this?.ap_id ?? `${config.baseurl}/federation/p/${this.id}`,
      type: 'Place',
      name: this.name,
      address: this.address,
      url: this?.ap_id ?? `${config.baseurl}/place/${this.id}/${encodeURIComponent(this.name)}`,
      ...(this.latitude && this.longitude && ({ latitude: this.latitude, longitude: this.longitude }))
    }
  }


}

export type UserRole = "admin" | "editor" | "user"

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
  declare role: UserRole

  @HasMany(() => Event, { foreignKey: 'userId', sourceKey: 'id' })
  declare events?: NonAttribute<Event[]>

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
        log.info('inside hashPassword', password)
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
  declare APUsers?: NonAttribute<APUser[]>

  // @HasMany(() => Event, /* foreign key */ 'placeId')
  // declare events?: NonAttribute<Event[]>;

}


type APUserObject = {
  name: string,
  icon: { url: string },
  summary?: string,
  preferredUsername: string,
  discoverable?: boolean,
  indexable?: boolean,
  attachments?: Array<{
    type: string,
    name: string,
    url: string
  }>,
  url?: string,
  publicKey?: {
    id: string,
    owner: string,
    publicKeyPem: string
  }
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

  @CreatedAt
  declare readonly createdAt: CreationOptional<Date>

  @UpdatedAt
  declare readonly updatedAt: CreationOptional<Date>

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
  timestamps: true
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

  @Attribute(DataTypes.INTEGER.UNSIGNED)
  @Index
  declare sortIndex: CreationOptional<number>

  @CreatedAt
  declare readonly createdAt: CreationOptional<Date>

  @UpdatedAt
  declare readonly updatedAt: CreationOptional<Date>

  @BeforeCreate
  static async autoincrementSortIndex(collection: Collection, options: AggregateOptions<InferAttributesOptions<Collection>>) {
    const maxSort: number | null = await Collection.max('sortIndex', { transaction: options.transaction })
    collection.sortIndex = (maxSort ?? 0) + 1
  }

  @HasMany(() => Filter, { foreignKey: 'collectionId', sourceKey: 'id' })
  declare filters?: NonAttribute<Filter[]>

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
  declare negate: boolean

  @Attribute(DataTypes.JSON)
  declare tags: any

  @Attribute(DataTypes.JSON)
  declare places: any

  @Attribute(DataTypes.JSON)
  declare actors: any

  // If collectionId is a foreign key, you may want to add:
  @Attribute(DataTypes.INTEGER)
  declare collectionId: number

  @BelongsTo(() => Collection, { foreignKey: 'collectionId', targetKey: 'id' })
  declare collection?: NonAttribute<Collection>

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

  // @Attribute({
  //     type: DataTypes.STRING,
  //     references: { table: "ap_users", key: "ap_id" },
  //     onUpdate: "CASCADE",
  //     onDelete: "CASCADE",
  // })
  // declare apUserApId: string

  // @BelongsTo(() => APUser, { foreignKey: 'apUserApId', targetKey: 'ap_id' })
  // declare apUser?: NonAttribute<APUser>

  @Attribute({
    type: DataTypes.INTEGER.UNSIGNED,
    references: { table: "events", key: "id" },
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
  })
  declare eventId: number

  @BelongsTo(() => Event, { foreignKey: 'eventId', targetKey: 'id' })
  declare event?: NonAttribute<Event>
}

@Table({
  tableName: 'pages',
  timestamps: true
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

  @BeforeCreate
  static async generateSlug(page: Page) {
    if (page.title && !page.slug) {
      let baseSlug = slugify(page.title, { lower: true, strict: true })
      let slug = baseSlug
      let count = 1

      // Ensure slug is unique
      while (
        await Event.findOne({
          where: { slug, id: { [Op.ne]: page.id } }
        }) // skip self in case of update
      ) {
        slug = `${baseSlug}-${count++}`
      }

      page.slug = slug
    }
  }

  @CreatedAt
  declare readonly createdAt: CreationOptional<Date>

  @UpdatedAt
  declare readonly updatedAt: CreationOptional<Date>
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
