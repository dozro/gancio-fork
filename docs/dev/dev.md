---
layout: default
title: Hacking
permalink: /dev
nav_order: 5
has_children: true
---

### Development Stack

**Gancio** is built with following technologies:

- [Nuxt.js](https://nuxt.com/)
- [Vue.js](https://vuejs.org/)
- [Bun.sh](https://bun.sh/)
- [Sequelize](https://sequelize.org/)
- [Vuetify](https://vuetifyjs.com/)

### Testing on your own machine

1. Download source
```bash
git clone https://framagit.org/les/gancio
git checkout main
```

2. Install bun
```bash
curl -fsSL https://bun.sh/install | bash
```

2. Install dependencies
```bash
bun install
```

3. Use a default sqlite configuration
```bash
cp config.example.json config.json
```

4. Run db migrations
```bash
./node_modules/.bin/sequelize db:migrate
```

5. Create a first admin user  
```bash
./server/cli.js users create admin secretpassword admin
```

6. Hacking
```bash
bun dev
```

> info "Info"
> You can skip step n.5 and register the user from the UI, the first registered user will be an active administrator.

#### Using Docker

1. Build the container
```bash
docker build -f Dockerfile.dev -t gancio .
```

2. Install dependencies
```bash
docker run -v $PWD:/home/node -it gancio bun install
```

3. Hacking
```bash
docker run -v $PWD:/home/node -it gancio
```


### Notes about hacking
This section is to support people who want to contribute to the source code.
Please use the [issues](https://framagit.org/les/gancio/-/issues) to discuss any modification.


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
- utilities helper function without state



## API / Backend > (/server)
In Nuxt3, API endpoints and server routes are defined inside the `/server` directory. There are two main ways to create backend logic:

- **API Routes:**  
  Place files inside `/server/api/`. Each file (e.g., `/server/api/hello.get.ts`) automatically becomes an endpoint (e.g., `/api/hello`). The filename and extension determine the HTTP method (`.get.ts`, `.post.ts`, etc.). You can export a default function that receives the `event` object, which contains request and context information.

  Example:
  ```js
  // /server/api/hello.get.ts
  export default defineEventHandler((event) => {
    return { message: 'Hello from API!' }
  })
  ```

- **Custom Server Routes:**  
  For more advanced routing, place files in `/server/routes/`. The filename and folder structure map directly to the route path. You can use any HTTP method and have full control over the request/response.

  Example:
  ```js
  // /server/routes/custom.ts
  export default eventHandler((event) => {
    return 'Custom route response'
  })
  ```

**How it works:**
- Nuxt3 uses [Nitro](https://nitro.unjs.io/) as the server engine, which automatically scans the `/server` directory for API and route files.
- You can access query parameters, request body, and headers using utilities like `getQuery(event)`, `readBody(event)`, and `getHeaders(event)`.
- Middleware and plugins can be added in `/server/middleware/` and `/server/plugins/` for logic like authentication, logging, or database connections.

**Summary:**
- Use `/server/api/` for RESTful endpoints with automatic routing.
- Use `/server/routes/` for custom or advanced server logic.
- All routes are available under the `/api/` prefix (for `/server/api/`) or at the root (for `/server/routes/`).
- Server code runs only on the backend and can securely access environment variables, the database, and other server-side resources.





### Settings
You can use the `publicSettings` or `secretSettings` server utilities

### return errors
`throw createError({ status: 404, message: 'Not found' })`

### Getting random values
`crypto.randomUUID()`

### logs
`const log = useLogger('context')`
log.info / warning / error / debug

### GET params / query
raw: `event.context.params?.place`

### send raw file
`return sendStream(event, fs.createReadStream(filePath))`
check `server/routes/fallbackimage.png.ts`

### Require an admin user
`await requireAdminSession(event)`

### Get current logged user
`const { user } = await getUserSession(event)`

### Require a logged user
`const { user } = await requireUserSession(event)`


#### Task Manager
The **Task Manager** is an utility for scheduling and running background tasks. It is used to automate recurring maintenance and notification jobs without blocking the main application flow.

**What it's used for:**
<!-- - Sending daily or periodic notifications (e.g., email digests) -->
<!-- - Synchronizing federated profiles -->
- Cleaning up unused resources (tags, places, AP users)
- Creating and updating recurrent events
- Removing past federated events and related resources
- Send emails
- Send AP notifications


**How it works:**
- Tasks are defined as instances of the `Task` class, specifying a name, method to execute, repeat interval, and other options.
- The `TaskManager` manages a queue of these tasks, running them at the specified intervals.
- Tasks can be set to repeat, run once, or retry on failure.

**Example: Adding a new task**

To add a new task, you can use the `add` method of the `TaskManager`. For example, to run a custom cleanup function every hour:

```js

function myCustomCleanup() {
  // Your cleanup logic here
}

const taskManager = useTaskManager()
taskManager.add({
  name: 'MY_CUSTOM_CLEANUP',
  method: myCustomCleanup,
  repeat: true,
  repeatDelay: 60 * 60 // seconds (1 hour)
})
```

**Task options:**
- `name`: String, name of the task
- `method`: Function to execute
- `args`: Array, arguments to pass to the method (optional)
- `repeat`: Boolean, whether the task should repeat (default: false)
- `repeatDelay`: Number, interval in seconds between executions (default: 1)
- `callAtStart`: Boolean, whether to run the task immediately on startup (default: false)
- `retries`: Array, delays in seconds for retrying failed tasks (default: [2, 5])


#### Sending E-mail

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

This will add a mail-sending task to the Task Manager queue. The actual sending is handled asynchronously, and you can customize the template and variables as needed.
Email templates are located in the `/server/emails/` directory. The content of these emails is localized, with translations and language-specific strings stored in `i18n/locales/email`.
