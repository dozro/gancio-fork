import { defineEventHandler } from 'h3'
import { publicSettings } from '~~/server/services'

export default defineEventHandler(() => publicSettings.status)
