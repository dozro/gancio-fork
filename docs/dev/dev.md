---
layout: default
title: Hacking
permalink: /dev
nav_order: 5
has_children: true
has_toc: false
---

# Development Stack

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

{: .info-title }
> info
>
> You can use `yarn`, `npm`, `bun` but you are on your own.

## 3. Hacking

```bash
pnpm run dev
```

{: .info }
> You can register an user from the UI, the first registered user will be an
> active administrator.

## 4. Contributing

If you want to contribute to the project, please take a look at [contribute]({% link contribute.md %}) section or check the [code]({% link dev/code.md %}) section for more technical details.