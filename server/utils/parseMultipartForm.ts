import type { H3Event, MultiPartData } from "h3"

export async function parseMultipartFormData(event: H3Event)  {
  const form = await readMultipartFormData(event)
  if (!form) return
  const fields: Record<string, string | MultiPartData> = {}
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
