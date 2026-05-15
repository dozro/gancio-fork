# Build
FROM node:24-bookworm AS builder

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml ./

RUN apt update && \
  apt -y install git coreutils jq && \
  pnpm install --frozen-lockfile

COPY . .
RUN npm run build:prod

# Run
FROM node:24-bookworm AS prod
ENV GANCIO_DATA=/app/data
USER node
WORKDIR /app

COPY --chown=node --from=builder /app/.pack/ .

VOLUME ["/app/data"]

EXPOSE 13120

CMD ["./server/gancio"]
