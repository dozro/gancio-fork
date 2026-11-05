// check that every API endpoint has a valid OpenAPI docstring -> https://framagit.org/les/gancio/-/work_items/580
import fs from 'fs/promises'
import swaggerJsdoc from 'swagger-jsdoc'

const files = (await fs.readdir('server/api', { recursive: true }))
  .filter(file => file.endsWith('.ts'))
  .map(file => `server/api/${file}`)
  .sort()

let failed = false

for (const file of files) {
  if (!(await fs.readFile(file, 'utf8')).includes('@openapi')) {
    console.error(`Missing @openapi docstring in ${file}`)
    failed = true
  }
}

try {
  // inputs are glob patterns, as in scripts/docs.sh (a file name like `[id].ts` would not match itself),
  // the definition is only required by swagger-jsdoc
  swaggerJsdoc({
    definition: { openapi: '3.1.0', info: { title: 'gancio', version: '' } },
    apis: ['openapiDef.yaml', 'server/api/**/*.ts'],
    failOnErrors: true
  })
} catch (e) {
  console.error(String(e))
  failed = true
}

if (failed) {
  process.exit(1)
}
console.log(`${files.length} API endpoints documented`)
