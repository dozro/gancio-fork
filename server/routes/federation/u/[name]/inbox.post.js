import { z } from "zod"
import { APUser } from "~/server/utils/sequelize"
import { verifySignature } from '~/server/federation/helpers'
const schema = z.object({
  ap_id: z.string()
})

export default defineEventHandler(async event => {
  const ret = await verifySignature(event)
  console.error(ret)
  // const body = await readValidatedBody(event, schema.parse)
})