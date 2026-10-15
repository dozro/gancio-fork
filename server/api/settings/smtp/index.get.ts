import { defineEventHandler } from 'h3'
import { handleCache } from '~~/server/lib/API'
import { requireAdmin } from '~~/server/lib/auth'
import { publicSettings, publicSettingsLastModified } from '~~/server/services'

/**
 * @openapi
 * /api/settings/smtp:
 *   get:
 *     summary: Get SMTP setting value (password is empty). Admin role is required.
 *     description: Get SMTP settings value
 *     responses:
 *       200:
 *         description: SMTP settings value.
 *         content:
 *           application/json:
 *             schema:
 *             type: object
 *             properties:
 *               auth:
 *                 type: object
 *                 properties:
 *                   user:
 *                     type: string
 *                     description: SMTP user
 *                     example: smtp@gancio.org
 *                   pass:
 *                     type: string
 *                     description: SMTP user password
 *                     example: password
 *               port:
 *                 type: integer
 *                 description: SMTP port
 *                 example: 465
 *               from:
 *                 type: string
 *                 description: Address used as the sender to send emails.
 *                 example: admin@gancio.org
 *               sendmail:
 *                 type: boolean
 *                 description: Use sendmail or not.
 *                 example: false
 *               secure:
 *                 type: boolean
 *                 description: SMTP secure (TLS or STARTTLS) or not.
 *                 example: true
 *               ignoreTLS:
 *                 type: boolean
 *                 description: Ignore TLS or not.
 *                 example: false
 *               requireTLS:
 *                 type: boolean
 *                 description: Require TLS or not.
 *                 example: true
 *       401:
 *         description: Unauthorized.
 *     tags:
 *       - Settings
 */
export default defineEventHandler(async (evt) => {
  await requireAdmin(evt)
  if (await handleCache(evt, publicSettingsLastModified['smtp'])) return

  // do not send credentials back to the client
  const { auth, ...settings } = publicSettings.smtp ?? {}
  return { ...settings, auth: { user: auth?.user, pass: '' } }
})