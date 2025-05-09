import { Event } from "#imports"

import {
  Sequelize,
  type HasManyCreateAssociationMixin,
  type InferAttributes,
  type InferCreationAttributes,
  type Options,
} from "@sequelize/core"


function parseMultipartFields(form)  {
  const fields = {}
  for (const item of form) {
    if ('value' in item) {
      fields[item.name] = item.value
    } else {
      fields[item.name] = item // file info
    }
  }
  return fields
}

export default defineEventHandler(async event => {
  const form = await readMultipartFormData(event)
  const parsed = parseMultipartFields(form)
  console.error(parsed.title.data)
  return Event.create( { title: parsed.title.data } )
})