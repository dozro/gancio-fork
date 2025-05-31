// import { openKv } from '@deno/kv'

// export default defineNuxtPlugin(async _nuxtApp => {
//   const log = useLogger('queue')
//   const db = await openKv()
  
//   async function processTask (task) {
//     log.warn(task)
//   }
  
//   db.listenQueue(processTask)
// })