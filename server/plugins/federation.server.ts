import { createFederation } from '@fedify/fedify'
import { integrateFederation, onError } from '@fedify/h3'
import { createRouter } from 'h3'
import { federation } from '../../federation'

export default defineNitroPlugin(async (nitroApp) => {

  // 2. Create router and integrate federation
  const router = createRouter()

  const federationMiddleware = integrateFederation(
    federation,
    (event, request) => {
      console.error('sono qui!')
      // You can attach per-request context here if needed
      return 'context data goes here'
    }
  )
  
  nitroApp.h3App.use(federationMiddleware) // Handles /.well-known, /activitypub, etc.
  nitroApp.h3App.use(router)

  // Optional: handle errors the Fedify way
  nitroApp.h3App.options.onError = onError
})