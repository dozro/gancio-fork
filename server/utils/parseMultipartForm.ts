import type { H3Event, MultiPartData } from 'h3'
import { get as getConfig } from '../config'
import path from 'path'
import sharp from 'sharp'
const log = useLogger('parseMultipartForm')

export async function parseMultipartFormData(event: H3Event) {
  const form = await readMultipartFormData(event)
  if (!form) return

  const fields: Record<string, unknown> = {}

  for (const item of form) {
    if (!item.name) continue

    const isArrayField = item.name.endsWith('[]')
    const key = isArrayField ? item.name.slice(0, -2) : item.name

    const value = item.filename ? item : item.data.toString('utf8')

    if (isArrayField) {
      if (!fields[key]) {
        fields[key] = []
      }
      fields[key].push(value)
    } else {
      if (fields[key]) {
        // If field already exists, convert to array to preserve both
        if (Array.isArray(fields[key])) {
          fields[key].push(value)
        } else {
          fields[key] = [fields[key], value]
        }
      } else {
        fields[key] = value
      }
    }
  }

  return fields
}

export async function saveUploadedImage(image: MultiPartData, dest: string) {
  const config = getConfig()
  const baseImgPath = path.resolve(config.upload_path, dest)

  // convert and resize to png
  sharp(image.data)
    .rotate()
    .resize(400)
    .png({ quality: 90 })
    .toFile(baseImgPath + '.png', (err) => {
      if (err) {
        log.error(err)
      }
    })

  return baseImgPath + '.png'
}

export async function saveUploadedEventImage(image: MultiPartData, name: string, focalpoint: [number, number]): Promise<Media | undefined> {
  const config = getConfig()
  const filename = crypto.randomUUID() + '.jpg'
  const sharpStream = sharp(image.data, { failOnError: true })
  const promises = [
    sharpStream.clone().rotate().resize(500, null, { withoutEnlargement: true })
      .jpeg({ mozjpeg: true, progressive: true }).toFile(path.resolve(config.upload_path, 'thumb', filename)),
    sharpStream.clone().rotate().resize(1200, null, { withoutEnlargement: true })
      .jpeg({ quality: 95, mozjpeg: true, progressive: true }).toFile(path.resolve(config.upload_path, filename))
  ]

  try {
    const res = await Promise.all(promises)
    const info = res[1]
    return {
      name,
      url: filename,
      height: info.height,
      width: info.width,
      size: info.size,
      focalpoint
    }
  } catch (e) {
    log.error(e)
  }
}
