import path from 'path'

const config = {
  status: 'SETUP',
  baseurl: process.env.BASE_URL || 'http://localhost:13120',
  log_level: process.env.LOG_LEVEL || 'debug',
  log_path: path.resolve(process.env.LOG_PATH || '', 'logs'),
  db: {
    dialect: (process.env.DB_DIALECT || 'sqlite') as 'sqlite' | 'mariadb',
    storage: process.env.DB_STORAGE || 'gancio.sqlite'
  },
  user_locale: path.resolve(process.env.USER_LOCALE || 'user_locale'),
  upload_path: path.resolve(process.env.UPLOAD_PATH || 'uploads'),
  plugins_path: path.resolve(process.env.PLUGINS_PATH || 'plugins'),
  hidden_service: process.env.ALLOW_ACCESS_TO_HIDDEN_SERVICE || '',
  proxy: {
    protocol: process.env.PROXY_PROTOCOL || '',
    hostname: process.env.PROXY_HOSTNAME || '',
    host: process.env.PROXY_HOST || '',
    port: process.env.PROXY_PORT || '',
    auth: {
      username: process.env.PROXY_USERNAME || '',
      password: process.env.PROXY_PASSWORD || ''
    },
    headers: process.env.PROXY_HEADERS && JSON.parse(process.env.PROXY_HEADERS) || {}
  }
}

console.error(config)
export default config

//   write (config_path= process.env.config_path || './config.json') {
//     delete config.status
//     return fs.writeFileSync(config_path, JSON.stringify(config, null, 2))
//   },

//   load () {
//     // load configuration from file
//     const config_path = process.env.config_path || './config.json'
//     console.info(`> Reading configuration from: ${config_path}`)
//     if (fs.existsSync(config_path)) {
//       const configContent = fs.readFileSync(config_path)
//       Object.assign(config, JSON.parse(configContent))
//       config.status = 'CONFIGURED'
//       config.hostname = new URL.URL(config.baseurl).host
//     } else {
//       config.status = 'SETUP'
//       console.info('> Configuration file does not exists...')
//     }
//   }
// }

// try {
//   config.load()
// } catch (e) {
//   console.error(e)
// }
// module.exports = config
