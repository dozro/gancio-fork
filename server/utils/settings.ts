import { z } from 'zod'

export type KeyValueType =
| { [key: string]: string | boolean }
// import { SettingType } from './sequelize'

export const settingSchema = z.object({
  key: z.string(),
  is_secret: z.boolean().default(false),
  value: z.union([z.string(), z.boolean()])
})

export type SettingType = z.infer<typeof settingSchema>

export const publicSettings:KeyValueType = {}
export const secretSettings:KeyValueType = {}

export function getSetting (key: string) {
    return publicSettings[key]
}

export async function getSettings () {
  return Setting.findAll({ raw: true })
}

export function setSetting (setting: SettingType) {
  if (setting.is_secret) {
      secretSettings[setting.key] = setting.value
  } else {
      publicSettings[setting.key] = setting.value
  }
  return Setting.upsert(setting)
}

export async function loadSettings () {
  const settings = await Setting.findAll({ raw: true })
  for (const setting of settings) {
    if (setting.is_secret) {
      secretSettings[setting.key] = setting.value
    } else {
      publicSettings[setting.key] = setting.value
    }
  }
}
