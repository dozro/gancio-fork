
import Email from 'email-templates'
import { DateTime } from 'luxon'
import path from 'path'
import locales from '../i18n/locales/index.js'

export default function sendMail (mail) { //addresses, template, locals, locale, bcc=false) {
  const { to: addresses, template, bcc, locals } = mail
  const locale = 'en'
  const settings = { title: 'Gancio', admin_email: 'antani' }
  
  console.error(mail)
  // this hack is needed because there are more standards to indicate language code
  // https://framagit.org/les/gancio/-/issues/539#note_2198016
  const localeMapOverride = {
    'sr-Cyrl': 'Cy-sr-SP',
    'sr-Latn': 'Lt-sr-SP',
  }
  // const settings = settingsController.settings
  // locale = locale || settings.instance_locale
  // locale = localeMapOverride?.[locale] ?? locale
  // log.info(`Send ${template} email to ${addresses} with locale ${locale}`)
  const email = new Email({
    // views: { root: path.join(__dirname, '..', 'emails') },
    htmlToText: true,
    juice: true,
    juiceResources: {
      preserveImportant: true,
      // webResources: {
      //   relativeTo: path.join(__dirname, '..', 'emails')
      // }
    },
    message: {
      from: `"📅 ${settings.title}" <${settings.admin_email}>`
    },
    send: true,
    i18n: {
      // directory: path.join(__dirname, '..', '..', 'locales', 'email'),
      objectNotation: true,
      syncFiles: false,
      retryInDefaultLocale: true,
      updateFiles: false,
      defaultLocale: 'en',
      locale,
      locales: Object.keys(locales).map(l => localeMapOverride?.[l] ?? l)
    },
    transport: settings.smtp || {}
  })

  const opt = {
    zone: settings.instance_timezone,
    locale
  }

  const msg = {
    template,
    message: {
      [bcc ? 'bcc' : 'to']: addresses
    },
    locals: {
      ...locals,
      locale,
      config: { title: settings.title, baseurl: settings.baseurl, description: settings.description, admin_email: settings.admin_email },
      datetime: timestamp => DateTime.fromSeconds(timestamp, opt).toFormat('EEEE, d MMMM HH:mm')
    }
  }
  return email.send(msg)
}
