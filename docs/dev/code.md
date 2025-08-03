---
layout: default
title: Code
permalink: /dev/code
parent: Hacking
nav_order: 2
---

# Code
{: .no_toc }
This section is to support people who want to contribute to the source code.

Building software means taking a stand, making decisions, choices: you can read our choices on [the homepage](https://gancio.org)

To help with issues you can check for [Contibution welcome](https://framagit.org/les/gancio/-/issues/?sort=updated_desc&state=opened&label_name%5B%5D=Contribution%20welcome&first_page_size=100), [good first issue](https://framagit.org/les/gancio/-/issues/?sort=updated_desc&state=opened&label_name%5B%5D=good%20first%20issue&first_page_size=100 ) or [help needed](https://framagit.org/les/gancio/-/issues/?sort=updated_desc&state=opened&label_name%5B%5D=good%20first%20issue&first_page_size=100) tags.

**Please use clean, concise titles for your pull requests.** Unless the pull request is about refactoring code or other internal tasks, assume that the person reading the pull request title is not a programmer but an user and **try to describe your change or fix from their perspective**. We use commit squashing, so the final commit in the main branch will carry the title of the pull request, and commits from the main branch are fed into the changelog. 
Please use [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/) in your commit messages.  
Please make forks you want to merge upstream public and possibly [allow commits](https://docs.gitlab.com/user/project/merge_requests/allow_collaboration/#allow-commits-from-upstream-members) from upstream members when requesting a merge request.  

1. TOC
{:toc}



<!-- 
TODO
#### Nuxt3 / Gancio lifecycle:
- nuxt.config.ts:
  load the `runtimeConfig` from environment: `base_url`, db parameters and gancio `version` from package.json)
  - fallback from legacy config.json?

- loading nitro plugins in server/plugins:
  - connect to the database
  - load settings (populate publicSettings /secretSettings utility)

- nuxt server plugins in server (middleware, api, routes)

- runtime plugins in plugins (.client.ts / .server.ts)

- composable for reusable vue logic (auth)
- plugins for global initialization or inject functionality (provide luxon, provide notify)
- utilities helper function without state -->



## API / Backend
In Nuxt3, API endpoints and server routes are defined inside the `/server` directory. For more details, see the [Nuxt Server Directory documentation](https://nuxt.com/docs/guide/directory-structure/server).
Nuxt3 uses [Nitro](https://nitro.unjs.io/) as the server engine, which automatically scans the `/server` directory for API and route files.
Server code runs only on the backend and can securely access environment variables, the database and other server-side resources.

There are two main ways to create backend logic:

- **API Routes:**  
  Place files inside `/server/api/`. Each file (e.g. [server/api/utils/ping.ts]({{ site.gh_edit_repository }}/-/tree/main/server/api/utils/ping.ts) automatically becomes an endpoint (`/api/utils/ping`).
  The filename and extension determine the HTTP method (`.get.ts`, `.post.ts`, etc.). 

- **Custom Server Routes:**  
  For more advanced routing, place files in `/server/routes/`. The filename and folder structure map directly to the route path. You can use any HTTP method and have full control over the request/response.


### Access query parameters
You can use `event.context.params?.query` or `getQuery(event)`

[example]({{site.gh_edit_repository}}/-/tree/main/server/api)


### Access route api params
You can use `event.context.params?.name` or `getRouterParam(event, 'name')` or `const { name } = getRouterParams(event)


### Access Request Headers
`getHeaders(event)`


### Access body
This is needed to access `POST` or `PUT` HTTP method.

`readBody(event)`


### Set header
`setHeader('Content-Type', 'application/json')`


<!-- - Middleware and plugins can be added in `/server/middleware/` and `/server/plugins/` for logic like authentication, logging, or database connections. -->

### Access global settings
You can use the `publicSettings` or `secretSettings` server utilities

### return errors
`throw createError({ status: 404, message: 'Not found' })`


### Getting random values
`crypto.randomUUID()`

### logs
`const log = useLogger('context')`

log.info / warning / error / debug

### Send a raw file
`return sendStream(event, fs.createReadStream(filePath))`

The event card fallback image is an example => [`server/routes/fallbackimage.png.ts`]({{site.gh_edit_repository}}/-/blob/main/server/routes/fallbackimage.png.ts)



## Authentication
There are some utilities so manage authentication via cookies and via JWT token.

### Require an admin user
`await requireAdminSession(event)`

### Get current logged user
`const { user } = await getUser(event)`

### Require a logged user
`const { user } = await requireUserSession(event)`

### Documenting API
As you can see in the [API]({% link dev/api.md %}) page, there are some documented API.
This is done via the `scripts/gendocs.js` (its quite an hack because of jsdoc/tsdoc) that parse some files in `server/api` to extract the documentation and use the `scripts/api_template.hbs` template to create the `docs/api.md` source that jekyll will parse.

The HTTP method and the API routes are calculated from file path.

``` js
/**
 * Login via JWT
 * To interact with some API you'll need an `access_token` you'll get from this call
 * @param {string} email
 * @param {string} password
 * @return A 401 HTTP Status in case of bad credentials
 * @auth
 * @see #234
 * @example
 * ```js
 * const auth = { email: 'admin', password: 'my_super_secret_password' }
 * fetch("http://localhost:4000/api/login/token", {
 *   "headers": { "content-type": "application/json" },
 *   "body": auth,
 *   "method": "POST"
 * })
 * ```
 */

```

## Task Manager / Queue scheduling

The **[Task Manager]({{site.gh_edit_repository}}/-/blob/main/server/utils/taskManager.js)** is an utility for scheduling and running background tasks. It is used to automate recurring maintenance and notification jobs without blocking the main application flow.  
We initially evaluated several existing solutions, including Redis-based queue managers like [Bull](https://github.com/OptimalBits/bull) and job schedulers like [Croner](https://github.com/hexagon/croner), however, Redis’s licensing model at the time was incompatible and we want to avoid adding another dependency.

We also reviewed [nightcoral](https://code.lag.net/robey/nightcoral), a lightweight and well-designed task queue but while the codebase was impressive we realized we could achieve similar functionalities by extending our existing TaskManager implementation adding exception management and customizable retries on failure.


**What it's used for:**
- Cleaning up unused / orphan resources (tags, places, AP actors - running once a day) 
- Creating new instances of recurring events (running each half an hour)
- Removing past federated events and related resources (twice a day)
- [Sending ActivityPub notifications]({{site.gh_edit_repository}}/-/tree/main/server/federation/helpers.js#L81)
- Sending e-mails

**What we will use it for:**
- Sending daily or periodic notifications
- Synchronizing federated profiles


**How it works:**
- Tasks are defined as instances of the `Task` class, specifying a name, method to execute, repeat interval, and other options.
- The `TaskManager` manages a queue of these tasks, running them at the specified intervals.
- Tasks can be set to repeat, run once, retry on failure.

**Example: Adding a new task**

First of all you'll need the utils `useTaskManager`: this will expose you the singleton instance of the TaskManager.  
To add a new task, you can use the `add` method of the `TaskManager`. For example, [the code]({{site.gh_edit_repository}}/-/blob/main/server/utils/sendMail.ts) that enqueue an email is:

```js
  useTaskManager().add({
    name: 'MAIL',
    method: sendMail,
    args: [addresses, template, locals, locale, bcc],
  })
```


**Task options:**
- `name`: String, name of the task (used in logs)
- `method`: Function to execute
- `args`: Array, arguments to pass to the method (optional)
- `repeat`: Boolean, whether the task should repeat (default: false)
- `repeatDelay`: Number, interval in seconds between executions (default: 1)
- `callAtStart`: Boolean, whether to run the task immediately when added (default: false)
- `retries`: Array, delays in seconds for retrying failed tasks (default: [10, 30])



### Sending E-mail

To send emails in the background, use the `enqueueMail` utility. This schedules the email to be sent as a task, ensuring that email delivery does not block the main application flow and retrying in case of failure. For example:

```js
enqueueMail(
  'user@example.com',      // recipient addresses (string or array)
  'register',              // template name (template files are in `/server/emails`)
  { username: 'Alice' },   // template variables (optional)
  'en',                    // locale (optional)
  false                    // use BCC for recipient (optional)
)
```

This will add a mail-sending task to the [[Task Manager]] queue. The actual sending is handled asynchronously, and you can customize the template and variables as needed.
Email templates are located in the `/server/emails/` directory. The content of these emails is localized, with translations and language-specific strings stored in `i18n/locales/email`.
