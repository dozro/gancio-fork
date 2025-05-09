export default defineNuxtPlugin((nuxtApp) => {
  const { $once, $emit } = nuxtApp
  
  function confirm (msg: string) {
    $emit('confirmDialog', { msg })
    return new Promise((resolve, reject) => {
      $once('confirmDialog:result', resolve)
    })
  }
  
  function notify (msg: string, status) {
    $emit('notify', { msg, status })
  }

  function prompt (msg: string, status, name) {
    $emit('promptDialog', { msg, status: 'warning', name })
    return new Promise((resolve, _reject) => {
      $once('promptDialog:result', resolve)
    })
  }  

  return { provide: { confirm, notify, prompt } }
})
