import { openKv } from '@deno/kv'

// import { getSettings } from './settings'
// console.error(await getSettings())
// export default defineNuxtPlugin(async _nuxtApp => {
const log = useLogger('queue')
const db = await openKv()

// const settings = await getSettings()
async function processTask (task) {
  // const { publicSettings } = useSettings()
  log.warn('diocane')
  throw new Error('diocane')
}

console.error('prima di listen queue')
db.listenQueue(processTask)


// Expose methods to enqueue jobs
export async function usePushQueue (
  type: JobType,
  payload: unknown,
  options = { backOffSchedule: [3000, 6000] }
) {
  log.warn('enqueue', type)
  db.enqueue({ type, payload }, options )
  // const job: BaseJob = {
  //   id: crypto.randomUUID(),
  //   type,
  //   payload,
  //   retryCount: 0,
  //   maxRetries: options.maxRetries,
  //   retryDelayMs: options.retryDelayMs,
  //   nextAttemptAt: Date.now(),
  }
  
  // usePushQueue('email', {
  //   template: 'recover',
  //   id: crypto.randomUUID(),
  //   to: "user@example.com",
  //   subject: "Hello",
  //   body: "Welcome to our app!",
  // })
