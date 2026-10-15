import { defineEventHandler, readBody } from 'h3'
import { publicSettings, setSetting } from '~~/server/services'
import { requireAdmin } from '~~/server/lib/auth'

/**
 * @openapi
 * /api/settings/smtp:
 *   put:
 *     summary: Set SMTP
 *     description: Set SMTP settings. Admin role is required.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
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
 *     responses:
 *       200:
 *         description: SMTP setting set.
 *       401:
 *         description: Unauthorized
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Settings
 */

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const setting = await readBody(event)
  if (!setting?.auth?.pass) {
    setting.auth.pass = publicSettings.smtp?.auth?.pass
  }
  return setSetting('smtp', setting)
})