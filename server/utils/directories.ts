import fs from "node:fs"
import path from "node:path"
import { get as getConfig } from '../config'

export const THUMBNAILS_PATH = '/thumb'

export function getThumbnailsPath(config = getConfig()) {
  return path.join(config.upload_path, THUMBNAILS_PATH)
}

export async function useCreateDirectoryStructure() {
  const log = useLogger('init')

  const thumbPath = getThumbnailsPath()
  try {
    await fs.promises.mkdir(thumbPath, { recursive: true })
    log.info(`Thumbnails directory created at "${thumbPath}"`)
  } catch (err) {
    log.error(err)
  }
}
