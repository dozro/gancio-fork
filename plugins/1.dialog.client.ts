import { Statuses } from "~/types/settings"

export default defineNuxtPlugin((nuxtApp) => {
  console.error('dialog!')
  const { $once, $emit } = useNuxtApp() // nuxtApp
  
  function confirm (msg: string) {
    $emit('confirmDialog', { msg })
    return new Promise((resolve, reject) => {
      $once('confirmDialog:result', resolve)
    })
  }
  
  function notify (msg: string, status: Statuses = Statuses.SUCCESS) {
    $emit('notify', { msg, status })
  }

  function prompt (msg: string, status: Statuses, name: string) {
    $emit('promptDialog', { msg, status, name })
    return new Promise((resolve, _reject) => {
      $once('promptDialog:result', resolve)
    })
  }  

  return { provide: { confirm, notify, prompt } }
})
