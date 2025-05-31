
// import Email from 'email-templates'
// import path from 'path'
// import { DateTime } from 'luxon'
// const locales = require('../../locales')

export function sendMail(addresses: string | string[], template: string, locals: any, locale: string, bcc: boolean) {
  const log = useLogger('mail')
  locale = locale ?? publicSettings.instance_locale
  if (process.env.NODE_ENV === 'production' && (!publicSettings.admin_email || !publicSettings.smtp)) {
    log.error(`Cannot send any email: SMTP Email configuration not completed!`)
    return
  }

  log.debug(`Enqueue new email ${template} ${locale}`)
    // const task = new Task({
    //   name: 'MAIL',
    //   method: mail._send,
    //   args: [addresses, template, locals, locale, bcc]
    // })
    // TaskManager.add(task)
}

//   _send (addresses, template, locals, locale, bcc=false) {
//     // this hack is needed because there are more standards to indicate language code
//     // https://framagit.org/les/gancio/-/issues/539#note_2198016
//     const localeMapOverride = {
//       'sr-Cyrl': 'Cy-sr-SP',
//       'sr-Latn': 'Lt-sr-SP',
//     }
//     const settings = settingsController.settings
//     locale = locale || settings.instance_locale
//     locale = localeMapOverride?.[locale] ?? locale
//     log.info(`Send ${template} email to ${addresses} with locale ${locale}`)
//     const email = new Email({
//       views: { root: path.join(__dirname, '..', 'emails') },
//       htmlToText: true,
//       juice: true,
//       juiceResources: {
//         preserveImportant: true,
//         webResources: {
//           relativeTo: path.join(__dirname, '..', 'emails')
//         }
//       },
//       message: {
//         from: `"📅 ${settings.title}" <${settings.admin_email}>`
//       },
//       send: true,
//       i18n: {
//         directory: path.join(__dirname, '..', '..', 'locales', 'email'),
//         objectNotation: true,
//         syncFiles: false,
//         retryInDefaultLocale: true,
//         updateFiles: false,
//         defaultLocale: 'en',
//         locale,
//         locales: Object.keys(locales).map(l => localeMapOverride?.[l] ?? l)
//       },
//       transport: settings.smtp || {}
//     })

//     const opt = {
//       zone: settings.instance_timezone,
//       locale
//     }

//     const msg = {
//       template,
//       message: {
//         [bcc ? 'bcc' : 'to']: addresses
//       },
//       locals: {
//         ...locals,
//         locale,
//         config: { title: settings.title, baseurl: settings.baseurl, description: settings.description, admin_email: settings.admin_email },
//         datetime: timestamp => DateTime.fromSeconds(timestamp, opt).toFormat('EEEE, d MMMM HH:mm')
//       }
//     }
//     return email.send(msg)
//       .catch(e => {
//         log.error('[MAIL]', e)
//         throw e
//       })
//   }
// }
