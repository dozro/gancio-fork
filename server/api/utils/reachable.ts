export default defineEventHandler(() => {
  return $fetch(`${publicSettings.baseurl}/api/utils/ping`)
})
