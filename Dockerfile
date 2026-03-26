# Build
FROM node:24-alpine AS builder

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# Run
FROM node:24-alpine AS prod

ENV NODE_ENV=production
USER node
WORKDIR /app

COPY --from=builder /app/.output/ ./nuxt
RUN mkdir uploads
COPY ./server/migrations ./nuxt/server/migrations/

COPY i18n ./nuxt/server/i18n/
COPY .env.example ./.env

# pug rss template / mail template
COPY ./server/emails ./nuxt/server/emails/

COPY ./server/services/rss.pug .nuxt/server/rss.pug
COPY ./server/services/opensearch.pug ./nuxt/server/opensearch.pug


COPY ./uploads/logo.png ./uploads/
COPY ./uploads/fallbackimage.svg ./uploads/
COPY ./uploads/headerimage.svg ./uploads/
COPY ./gancio_plugins ./plugins

EXPOSE 13120

CMD ["node", "./nuxt/server/index.mjs"]