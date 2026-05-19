# API documentation

This API documentation is intented to interact with a Gancio instance from external tool (e.g. to insert events and getting them).
Feel free to contribute your own tips or examples to help each others.


## Login via JWT
To interact with some API you'll need an `access_token` you'll get from this call

**`/api/login/token`**

POST 



**Params**

| Name | Type | Description |
| -----|------|------|
| email | `string` |  |
| password | `string` |  |

**Returns**  
- A JSON response with an `access_token` property you have to use in `Authorization: Bearer <access_token>` header for authenticated request.  

- A 401 HTTP Status in case of bad credentials  



**Example**
```js
const auth = { email: 'admin', password: 'my_super_secret_password' }
fetch("http://localhost:4000/api/login/token", {
  "headers": { "content-type": "application/json" },
  "body": auth,
  "method": "POST"
})
```




## Update user activation or role

**`/api/user/[id]`**

<badge class="label label-orange">PUT</badge>
<badge class="label label-red">AUTH NEEDED</badge>


::: tip
when user is activated a confirmation e-mail is sent with a link that allow to choose a password
:::


**Params**

| Name | Type | Description |
| -----|------|------|
| is_active | `boolean` | Activate / Deactivate user |
| role | `string` | User role ('user','admin','editor') |







## Get current authenticated user

**`/api/user`**







**Example**
**Response**
```json
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