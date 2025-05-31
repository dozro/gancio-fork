import { openKv } from '@deno/kv'
export const useKv = async () => {
  return openKv('kv.db')
}
