import { DataTypes, col, fn } from '@sequelize/core'
import slugify from 'slugify'

// 8 marzo
//  8marzo
// #8marzo
// 8marzo
// vin brulé
// vin brulè
// sport popolare
// #sport popolare
// #sportpopolare
// sport popolare
// Sport Popolare
//  solidarieta
// solidarietà
//  Solidarietà
// Solidarietà
// SOLIDARIETÀ
// soliedarieta
// the situation with tags is not ideal, the tag field is a string and is the primary key!! (ok this was done 8 years ago)!!
// events relate to tags via a many-to-many relationship through the `events_tags` table (eventId,tagTag is unique)
// the list up there is what I have in my database (2043 tags), we could do better via a separate normalizedTag field that should be unique.
// the difficult thing is porting old data:
// we create a new `normalizedTag` field and fill it with a normalized version of the tag field (lowercase, no accents, etc. probably using slugify)
// we end up with duplicated tags in `tags` table and in `events_tags` table so we have to merge them
// there are also events with different tags that will be the same when normalized (e.g. "solidarietà" and "Solidarietà")
// - create a new `normalizedTag` field
// - fill it with a normalized version
// - to merge duplicated tags in `event_tags` we keep the most used tag:

// tags:
// tag         | normalizedTag
// solidarietà | solidarieta
// Solidarietà | solidarieta

// event_tags:
// eventId | tagTag
//  1      | solidarietà
//  1      | Solidarietà
//  2      | solidarietà
//  3      | Solidarietà

// if this is the situation we should have at the end:

// tags:
// tag         | normalizedTag
// solidarietà | solidarieta
// 
// event_tags:
// eventId | tagTag
//  1      | solidarietà
//  2      | solidarietà
//  3      | solidarietà

// I will set an id as primary key in another migration
// normalize tags for consistent case/accent-insensitive matching (optional)
function normalizeTag(tag) {
  return slugify(tag, {
    replacement: '',
    lower: true,
    strict: true,
    // locale: publicSettings.instance_locale,
    remove: true
  })
}

export async function up({ context: queryInterface }) {
  
  await queryInterface.sequelize.transaction(async (transaction) => {

    // mock Tag model because its easier to do updates with it than raw queries and is not easy to import from the model in a migration
    const Tag = queryInterface.sequelize.define('Tag', {
      // id: { type: DataTypes.INTEGER, autoIncrement: true, allowNull: true },
      tag: { type: DataTypes.STRING, primaryKey: true },
      normalizedTag: { type: DataTypes.STRING, allowNull: true },
    }, { tableName: 'tags', transaction })
    
    const EventTag = queryInterface.sequelize.define('EventTag', {
      eventId: { type: DataTypes.INTEGER, primaryKey: true },
      tagTag: { type: DataTypes.STRING, primaryKey: true },
    }, { tableName: 'event_tags', timestamps: false })
    EventTag.belongsTo(Tag, { foreignKey: 'tagTag', targetKey: 'tag' })

    // new normalizedTag column
    await queryInterface.addColumn('tags', 'normalizedTag', { type: DataTypes.STRING, allowNull: true }, { transaction })

    // populate normalizedTag
    // Solidarietà => solidarieta
    const tags = await Tag.findAll({ transaction, raw: true })
    for (const row of tags) {
      const normalizedTag = normalizeTag(row.tag)
      await Tag.update({ normalizedTag }, { where: { tag: row.tag }, transaction })
    }


    // count event tags by normalizedTag so I can choose which ones to keep
    const eventTags = await EventTag.findAll({
      attributes: [
        [fn('COUNT', col('eventId')), 'count'],
        col('tagTag')
      ],
      order: [[fn('COUNT', col('eventId')), 'DESC']],
      include: [{ model: Tag, attributes: ['normalizedTag'], required: true }],
      group: ['tagTag', 'normalizedTag'],
      transaction,
      raw: true
    })
    
    const groups = {}
    for (const row of eventTags) {
      const normalized = row['tag.normalizedTag']
      const tag = row.tagTag
      const count = Number(row.count)
    
      if (!groups[normalized]) groups[normalized] = []
      groups[normalized].push({ tag, count })
    }
    
    // groups: { solidarieta: [ { tag: 'solidarietà', count: 2 }, { tag: 'Solidarietà', count: 1 } ] }
    for (const [normalized, tags] of Object.entries(groups)) {
      if (tags.length <= 1) continue
    
      // just to be sure
      tags.sort((a, b) => b.count - a.count)
    
      // keep the first tag (the most frequent)
      const keepTag = tags[0].tag
      const duplicates = tags.slice(1).map(t => t.tag)
    
      // in case I have duplicates (Solidarietà)
      if (duplicates.length) {
        console.log(`MERGE normalized: '${normalized}', keepTag: '${keepTag}'', duplicates: ${duplicates.join(', ')}`)

        // delete the duplicates tags for events with both the keepTag and the duplicate tag (the event with id:1 in the initial example)
        const keepRows = await EventTag.findAll({ attributes: ['eventId'], where: { tagTag: keepTag }, transaction, raw: true })
        const eventIdsWithKeep = keepRows.map(r => r.eventId)
        if (eventIdsWithKeep.length) {
          console.error(`deleting duplicates tags '${duplicates.join('\', \'')}' for ${keepTag} on ${eventIdsWithKeep.length} events`)
          await EventTag.destroy({ where: { tagTag: duplicates, eventId: eventIdsWithKeep }, transaction })
        }
        
        // update event_tags to use the keepTag for duplicates (event with the wrong tag, eventId: 3 in the example)
        console.error(`updating duplicates tags '${duplicates.join('\', \'')}' for ${keepTag}`)
        await EventTag.update( { tagTag: keepTag }, { where: { tagTag: duplicates }, transaction })
        
        // then delete unused tags
        console.error(`deleting tags '${duplicates.join('\', \'')}'`)
        await Tag.destroy({ where: { tag: duplicates }, transaction })
      }

    }

    // make normalizedTag non-nullable and unique
    await queryInterface.changeColumn('tags', 'normalizedTag', { type: DataTypes.STRING, allowNull: false }, { transaction })
    await queryInterface.addConstraint('tags', {
      fields: ['normalizedTag'],
      type: 'unique',
      name: 'unique_normalized_tag'
    }, { transaction })
    
  })
}
