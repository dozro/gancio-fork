    /**
     * Get current authenticated user
     * @category User
     * @name /api/user
     * @type GET
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
    
    export default defineEventHandler(async event => {
      const { user } = await requireUser(event)// await requireUserSession(event)
      return user
    })
    
    // api.get('/ping', (_req, res) => res.sendStatus(200))
    // api.get('/reachable', helpers.reachable)
    // api.get('/user', isAuth, (req, res) => res.json(req.user))
