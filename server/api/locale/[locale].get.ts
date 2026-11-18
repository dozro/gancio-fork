import { defineEventHandler } from 'h3'
import { handleCache } from '~~/server/lib/API'
import { publicSettings } from '~~/server/services'
import { getLocaleMessages } from '~~/server/services/locale'

/**
 * @openapi
 * /api/locale/{locale}:
 *   get:
 *     summary: Get locale details
 *     description: Get locale details.
 *     parameters:
 *       - name: locale
 *         in: path
 *         required: true
 *         example: it
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The locale details.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: Locale translation strings.
 *               example:
 *                 common:
 *                   add_event: Aggiungi evento
 *                   next: Continua
 *                 login:
 *                   description: Entrando puoi pubblicare nuovi eventi
 *                   check_email: Controlla la tua posta (anche lo spam)
 *       400:
 *         description: Error while getting locale.
 *     tags:
 *       - Locale
 */
export default defineEventHandler(async (event) => {
  const locale = event.context.params?.locale
    ?? publicSettings.instance_locale

  const { messages, maxLastModified } =
    await getLocaleMessages(locale)

  if (await handleCache(event, maxLastModified, 60)) {
    return
  }

  return messages
})
