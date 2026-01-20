/**
 * Get current authenticated user
 * @auth
 * @example **Response**
 * ```json
{
  "description" : null,
  "recover_code" : "",
  "id" : 1,
  "createdAt" : "2020-01-29T18:10:16.630Z",
  "updatedAt" : "2020-01-30T22:42:14.789Z",
  "is_active" : true,
  "settings" : "{}",
  "email" : "eventi@cisti.org",
  "is_admin" : true
}
```
*/
export default defineEventHandler(async (event) => {
  const { user } = await requireUser(event)
  return user
})
