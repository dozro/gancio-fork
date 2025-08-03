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
