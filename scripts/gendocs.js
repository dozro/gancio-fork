import fs, { lstatSync, readFileSync } from 'fs'
import { globSync } from 'node:fs'
import Handlebars from 'handlebars'
import jsdoc from 'jsdoc-api'
import babel from '@babel/core'
import { basename } from 'path'
const template = fs.readFileSync('./scripts/api_template.hbs', 'utf-8')

const apiFiles = globSync(['./server/api/events/**', './server/api/user/**', './server/api/login/**'])

const docs = await Promise.all(apiFiles.map(async (file) => {
  if (!lstatSync(file).isFile()) return
  console.error(`FILE: ${file}`)
  const filename = basename(file)
  const hasMethod = filename.split('.').length > 2
  let method = 'GET'
  if (hasMethod) {
    method = filename.split('.').slice(-2, -1)[0]?.toUpperCase()
  }
  const tmp_file = file.replace('server/api/', '')
  const route = `/api/${tmp_file.replace(/(\/index)?\.?(get|post|put|delete|patch)?\.[tj]s$/, '')}`

  const tsSource = readFileSync(file).toString()
  // Transpile TypeScript to JS using Babel
  const { code: jsCode } = babel.transformSync(tsSource, {
    filename: file,
    presets: ['@babel/preset-typescript'],
    parserOpts: { plugins: ['typescript'] }
  })

  try {
    const jsdocData = await jsdoc.explain({ source: jsCode }).catch(e => console.error(e))
    const api = jsdocData.find(m => m?.description)
    if (!api) return
    console.error(file, method, route)
    const description = api?.description || ''
    const params = api?.params || []
    const tags = api?.tags
    const examples = api?.examples
    const returns = api?.returns
    const see = api?.see

    const queryParams = method === 'GET' ? params : [] // params.filter(p => p.name.startsWith("query.") || p.name === "query")
    const bodyParams = method === 'POST' ? params : [] // params.filter(p => p.name.startsWith("body.") || p.name === "body")
    return { method, route, description, queryParams, bodyParams, params, examples, tags, returns, see }
  } catch {
    console.error('Error in file', file)
  }
}))

// TODO: inside the if_eq `this` is not the expected this
function if_eq (a, b, opts) {
  if (a == b) {
    return opts.fn(this)
  } else {
    return opts.inverse(this)
  }
}

Handlebars.registerHelper('if_eq', if_eq)
const compiledTemplate = Handlebars.compile(template)

// include only APIs with some jsdoc and at least a description
const output = compiledTemplate({ docs: docs.filter(a => a && a.description) })

fs.writeFileSync('docs/dev/api.md', output)
