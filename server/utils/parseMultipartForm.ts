import type { H3Event, MultiPartData } from "h3"
import config from "../config"
import path from "path"
import sharp from "sharp"
const log = useLogger('parseMultipartForm')

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

export async function saveUploadedFile (image: MultiPartData) {

  const filename = crypto.randomUUID() + '.jpg'
  const sharpStream = sharp(image.data, { failOnError: true })
  const promises = [
    sharpStream.clone().rotate().resize(500, null, { withoutEnlargement: true })
      .jpeg({ mozjpeg: true, progressive: true }).toFile(path.resolve(config.upload_path, 'thumb', filename)),
    sharpStream.clone().rotate().resize(1200, null, { withoutEnlargement: true } )
      .jpeg({ quality: 95, mozjpeg: true, progressive: true }).toFile(path.resolve(config.upload_path, filename))
  ]

  try {
    const res = await Promise.all(promises)
    const info = res[1]
    return {
      destination: config.upload_path,
      filename,
      path: path.resolve(config.upload_path, filename),
      height: info.height,
      width: info.width,
      size: info.size
    }
  } catch (e) {
    log.error(e)
    return null
  }
}