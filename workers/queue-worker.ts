// import { openKv } from '@deno/kv'
// import sendMail from './email.ts'
// const kv = await openKv('kv.sqlite')

// function delay(ms: number) {
//   return new Promise((res) => setTimeout(res, ms));
// }

// console.error('dentro il workers!')
// async function tryHandleJob(job: BaseJob): Promise<boolean> {
//   try {
//     switch (job.type) {
//       case "email":
//         console.log("Sending email:", job.payload)
//         await sendMail(job.payload)
//         break
//       case "compressImage":
//         console.log("Compressing image:", job.payload)
//         break
//       case "sendAP":
//         console.log("Sending AP message:", job.payload)
//         break
//     }
//     return true;
//   } catch (e) {
//     console.error("Error processing job:", e);
//     return false;
//   }
// }

// async function processQueue() {
//   console.error('process queue')
//   const HEAD_KEY = ["queue", "head"];
//   const TAIL_KEY = ["queue", "tail"];

//   const head = (await kv.get(HEAD_KEY)).value as number ?? 0;
//   const tail = (await kv.get(TAIL_KEY)).value as number ?? 0;

//   if (head >= tail) return

//   const job = (await kv.get(["queue", head])).value as BaseJob;

//   if (!job || job.nextAttemptAt > Date.now()) {
//     return
//   }

//   const success = await tryHandleJob(job)

//   if (!success && job.retryCount < job.maxRetries) {
//     await kv.set(["queue", tail], {
//       ...job,
//       retryCount: job.retryCount + 1,
//       nextAttemptAt: Date.now() + job.retryDelayMs,
//     })
//     await kv.set(TAIL_KEY, tail + 1)
//   }

//   await kv.delete(["queue", head])
//   await kv.set(HEAD_KEY, head + 1)
// }

// setInterval(processQueue, 2000)
