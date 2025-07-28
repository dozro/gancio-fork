export default defineEventHandler(event => {
  return $fetch(`${publicSettings.baseurl}/api/utils/ping`)
})