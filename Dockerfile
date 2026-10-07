# build gancio for production just for this platform (no embedded dependencies)
# check the build.sh script
FROM  --platform=$BUILDPLATFORM node:24-alpine AS builder
WORKDIR /app

# Set pnpm home and store path for consistent caching
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable
RUN apk add --no-cache git coreutils jq

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Use a cache mount for the pnpm store
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

COPY . .
RUN npm run build:prod

# prepare production dependencies for the final image for each platform
FROM node:24-alpine AS deps
WORKDIR /app

RUN corepack enable
COPY --from=builder /app/.pack/package.json /app/pnpm-workspace.yaml  ./

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --prod

# using the same build to create the npm package
# and export it as the only output artifact
FROM node:24-alpine AS pack
WORKDIR /app
COPY --chown=node --from=builder /app/.pack/ ./
RUN mkdir -p /artifacts && npm pack --pack-destination=/artifacts

# this is a clean npm package exported as a tarball
FROM scratch AS artifact
COPY --from=pack /artifacts/ /

# this is the production image for the gancio server
FROM  node:24-alpine AS prod
ENV GANCIO_DATA=/app/data
ENV NODE_ENV=production
USER node
WORKDIR /app

COPY --chown=node --from=builder /app/.pack/ .
COPY --chown=node --from=deps /app/node_modules/ ./node_modules/

VOLUME ["/app/data"]

EXPOSE 13120

CMD ["./server/gancio"]

