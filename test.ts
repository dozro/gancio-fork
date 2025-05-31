import { openKv } from "@deno/kv"
import type { KvKey } from '@deno/kv'

interface QueueMessage {
  key: KvKey;
  value: unknown;
}


const kv = await openKv()
let i = 0

kv.listenQueue(async (msg: unknown) => {
  const queueMsg = msg as QueueMessage;
  console.error('sono qui!', queueMsg)
  throw new Error('diocnae')
  // await kv.set(queueMsg.key, queueMsg.value);
});

// Enqueue first message
const res = await kv.enqueue(
  { key: ["test1"], value: "testing 1,2,3" },
  {
    delay: 1000,
    backOffSchedule: [ 1000 ],
    keysIfUndelivered: [["queue_failed", "test1`"], ["queue_failed", "test2"]],
  },
);
console.log("Queue result 1: ", res);

let msg1 = await kv.get(["test1"]);

console.log(`Enqueued value 1: ${JSON.stringify(msg1)}`);