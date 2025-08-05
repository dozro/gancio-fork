export default defineNuxtPlugin(() => {
  const { $once, $emit } = useNuxtApp() // nuxtApp
  
  function confirm (msg: string, args?: Object) {
    $emit('confirmDialog', { msg, args })
    return new Promise((resolve, _reject) => {
      $once('confirmDialog:result', resolve)
    })
  }
  
  function notify (msg: string | object, status: Statuses = Statuses.SUCCESS, args?: Object) {
    $emit('notify', { msg: String(msg), status, args })
  }

  function prompt (msg: string, title: string, label: string = '' ) {
    $emit('promptDialog', { msg, title, label })
    return new Promise((resolve, _reject) => {
      $once('promptDialog:result', resolve)
    })
  }  

  return { provide: { confirm, notify, prompt } }
})
