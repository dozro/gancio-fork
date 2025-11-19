---
layout: default
title: Hacking
permalink: /dev
nav_order: 5
has_children: true
---

## Development Stack

**Gancio** is built with following technologies:

- [Nuxt.js](https://nuxt.com/)
- [Vue.js](https://vuejs.org/)
- [Sequelize](https://sequelize.org/)
- [Vuetify](https://vuetifyjs.com/)

### Testing on your own machine

1. Download source

```bash
git clone https://framagit.org/les/gancio
```

2. Install dependencies
{: .info-title }
> info
>
> You can use `yarn`, `pnpm`, `bun` but you are on your own.

```bash
npm install
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

1. 