# Hacking

**Gancio** is built with following technologies

- [Nuxt.js](https://nuxt.com/)
- [Vue.js](https://vuejs.org/)
- [Sequelize](https://sequelize.org/)
- [Vuetify](https://vuetifyjs.com/)

## 1. Download source

```bash
git clone https://framagit.org/les/gancio
```

## 2. Install dependencies

```bash
pnpm install
```

::: info
You can use `yarn`, `npm`, `bun` or whatever but you are on your own.
:::

## 3. Start the development server

```bash
pnpm run dev
```

::: tip
You can register an user from the UI, the first registered user will be an active administrator.
:::

## 4. Run tests and code quality tools
 
We have a unit test suite that runs automatically in CI. You can run the same tests locally with the command below; it uses a local SQLite database.

```bash
pnpm run test
```

To run the same tests against MariaDB or PostgreSQL, start the Docker containers using `docker compose -f ./tests/docker-compose.yml`, then run the corresponding commands:

```bash
pnpm run test:mariadb
```

```bash
pnpm run test:postgres
```

We recommend using your IDE or editor's integrations for linting and TypeScript checks. If you're brave, you can also run the following scripts manually:

```bash
pnpm run lint
```

```bash
pnpm run typecheck
```

We also support checking i18n locale message syntax and circular dependencies with Madge:

```bash
pnpm run check:i18n
```

```bash
pnpm run check:circular
```

::: warning Yes
We know that there are a lot things to fix :D
:::

## 5. Contributing

If you want to contribute to the project, please take a look at [contribute](../contribute) section or check the [code](./code) section for more technical details.
