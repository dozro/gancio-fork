import type { H3Event } from "h3"
import { KeyValueType } from "./settings"

export async function parseMultipartFormData(event: H3Event)  {
  const form = await readMultipartFormData(event)
  if (!form) return
  const fields: KeyValueType = {}
  for (const item of form) {
    if (!item.name) continue
    if (!item.filename) {
      fields[item.name] = item.data.toString('utf8')
    } else {
      fields[item.name] = item // file info
    }
  }
  return fields
}
