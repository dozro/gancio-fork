---
layout: default
title: API
permalink: /dev/api
parent: Hacking
nav_order: 8
---

# API documentation
{: .no_toc }

This API documentation is intented to interact with a Gancio instance from external tool (e.g. to insert events and getting them).
Feel free to contribute your own tips or examples to help each others.
{: .fs-6 .fw-300 }


1. TOC
{:toc}




## Login via JWT
To interact with some API you'll need an `access_token` you'll get from this call

**`/api/login/token`**

POST 
{: .label .label-orange}



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

PUT 
{: .label .label-orange}

  **AUTH NEEDED**
  {: .label .label-red}


{: .info-title }
> info
>
> when user is activated a confirmation e-mail is sent with a link that allow to choose a password


**Params**

| Name | Type | Description |
| -----|------|------|
| is_active | `boolean` | Activate / Deactivate user |
| role | `string` | User role ('user','admin','editor') |







## Get current authenticated user

**`/api/user`**

GET 
{: .label .label-green}

  **AUTH NEEDED**
  {: .label .label-red}






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




## Create a new user.
the first user being created will automatically become an active admin.
For subsequent users, a recovery code is generated and sent via email to allow
the user to set their password and confirm their account creation

**`/api/user`**

POST 
{: .label .label-orange}

  **AUTH NEEDED**
  {: .label .label-red}



**Params**

| Name | Type | Description |
| -----|------|------|
| newUser.email | `string` | User email address |
| newUser.description | `string` | User description |
| newUser.role | `string` | User role ('user','admin','editor') |

**Returns**  
- Created user object  

- status `400` if user creation fails (e.g. email already exists)  







## Register a new user
This will send an email to the user and to all the administrators

**`/api/user/register`**

POST 
{: .label .label-orange}


{: .info-title }
> info
>
> The first registered user will be an active admin


**Params**

| Name | Type | Description |
| -----|------|------|
| email | `string` | user e-mail |
| password | `string` | description |
| description | `string` | description |







## Update an event

**`/api/events/[id]`**

PUT 
{: .label .label-orange}


{: .info-title }
> info
>
> `Content-Type` has to be `multipart/form-data` to support image upload


**Params**

| Name | Type | Description |
| -----|------|------|
| id | `number` | event id |
| title | `string` | event's title |
| description | `string` | event's description (html accepted and sanitized) |
| place_name | `string` | the name of the place |
| place_address | `string` | the address of the place |
| place_latitude | `float` | the latitude of the place |
| place_longitude | `float` | the longitude of the place |
| online_locations | `array` | List of online locations |
| start_datetime | `number` | start timestamp |
| multidate | `integer` | is a multidate event? |
| tags | `array` | List of tags |
| recurrent | `object` | Recurrent event details |
| recurrent.frequency | `string` | could be `1w` or `2w` |
| recurrent.days | `array` | array of days |
| image | `image` | Image |
| image_url | `string` | Image URL |







## Get events
Method to search for events with pagination and filtering

**`/api/events`**

GET 
{: .label .label-green}



**Params**

| Name | Type | Description |
| -----|------|------|
| start | `integer` | start timestamp (default: now) |
| end | `integer` | end timestamp (optional) |
| query | `string` | search for this string in title, place or tags |
| tags | `array` | List of tags |
| places | `array` | List of places id |
| show_multidate | `boolean` | Show also multidate events (default: true) |
| show_recurrent | `boolean` | Show also recurrent events (default: as choosen in admin settings) |
| show_federated | `boolean` | Show federated events too |
| max | `integer` | Limit events |
| page | `integer` | Pagination |
| older | `boolean` | select <= start instead of >= |
| reverse | `boolean` | reverse order |



**Example**
- [https://demo.gancio.org/api/events](https://demo.gancio.org/api/events)
- [usage example](https://framagit.org/les/gancio/-/blob/master/webcomponents/src/GancioEvents.svelte#L18-42)




## Add a new event
Allow anyone to add an event (anon event has to be confirmed)

**`/api/events`**

POST 
{: .label .label-orange}


{: .info-title }
> info
>
> `Content-Type` has to be `multipart/form-data` to support image upload


**Params**

| Name | Type | Description |
| -----|------|------|
| title | `string` | event's title |
| description | `string` | event's description (html accepted and sanitized) |
| place_name | `string` | the name of the place |
| place_address | `string` | the address of the place |
| place_latitude | `float` | the latitude of the place |
| place_longitude | `float` | the longitude of the place |
| online_locations | `array` | List of online locations |
| start_datetime | `number` | start timestamp |
| multidate | `integer` | is a multidate event? |
| tags | `array` | List of tags |
| recurrent | `object` | Recurrent event details |
| recurrent.frequency | `string` | could be `1w` or `2w` |
| recurrent.days | `array` | array of days |
| image | `image` | Image |
| image_url | `string` | Image URL |





