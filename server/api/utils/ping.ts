import { publicSettings } from "~~/server/services"

export default defineEventHandler(() => publicSettings.status)
