import { defineEventHandler, createError, readBody } from 'h3'
import { sendMail, publicSettings } from '~~/server/services'
import { requireAdmin } from '~~/server/lib/auth'

/**
 * @openapi
 * /api/settings/smtp/test:
 *   post:
 *     summary: Test SMTP parameters
 *     description: Send a test email with SMTP parameters. Admin role is required.
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
 *         description: Test email sent.
 *       400:
 *         description: Email could not be sent.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Settings
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const setting = await readBody(event)
  try {
    // use saved password in case it is not passed by
    if (!setting?.auth?.pass) {
      setting.auth.pass = publicSettings.smtp?.auth?.pass
    }
    return sendMail(publicSettings.admin_email, 'test', {}, undefined, false, setting)
  } catch (e) {
    throw createError({ statusCode: 400, statusMessage: String(e) })
  }
})