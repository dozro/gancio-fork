import fs from 'fs'
import path from 'path'

const locales = [
  'en', 'fr', 'de', 'es', 'it', 'pt', 'nl', 'pl', 'ru', 'zhHans',
  'ca', 'cs', 'da', 'fi', 'hr', 'sk', 'sl', 'sv', 'tr', 'ro',
  'srLatn', 'srCyrl', 'hu', 'el', 'bg', 'uk', 'ja', 'ko', 'th', 'vi'
]

const targetDir = path.resolve(__dirname, '../locales')

const template = (locale: string) => `import { defineI18nLocale } from '#i18n'
import { loadLocaleMessages } from '~/utils/i18n/loader'

export default defineI18nLocale(() => loadLocaleMessages('${locale}'))
`

function generateFiles() {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true })
  }

  for (const locale of locales) {
    const filePath = path.join(targetDir, `${locale}.ts`)
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, template(locale))
      console.log(`✅ Created: ${locale}.ts`)
    } else {
      console.log(`⏭️ Skipped: ${locale}.ts (already exists)`)
    }
  }
}

generateFiles()
