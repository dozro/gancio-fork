import { defineEventHandler } from 'h3'
import { col, fn } from '@sequelize/core'
import { APUser, Instance } from '~~/server/services'
import { requireAdmin } from '~~/server/lib/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const instances = await Instance.findAll({
    attributes: [
      'domain',
      'name',
      'blocked',
      'data',
      [fn('COUNT', col('APUsers.ap_id')), 'users']
    ],
    order: [['users', 'DESC']],
    group: ['domain'],
    include: [
      { model: APUser, attributes: [] }
    ]
  })
  // return instances
  return instances.map((i) => {
    const { data, ...instance } = i.get({ plain: true })
    return {
      ...instance,
      usage: data.usage
    }
  })
})
