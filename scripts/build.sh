#!/usr/bin/env sh

# this script prepares the `.pack` folder used to:
# - build the docker image
# - pack the npm package

set -eu

releaseType=production
while getopts 'dp' opt; do
  case "$opt" in
  d)
    releaseType=dev
    ;;
  p)
    releaseType=production
    ;;
  \?)
    exit 2
    ;;
  esac
done

if [ "$releaseType" = dev ]; then
  VERSION="dev-$(git describe --always)"
else
  VERSION=$(npm pkg get version | xargs echo)
fi

ROOT_DIR="$(pwd)"
STAGING_DIR="$ROOT_DIR/.pack"

echo "Cleaning staging directory..."
rm -rf "$STAGING_DIR"

pnpm install --frozen-lockfile

# clean past artifacts
npx nuxi cleanup

# build web UI
npx nuxi build

# echo "Building webcomponent"
# pnpm build:wc

# copy dereferencing symlinks
cp -R -L .output/ "$STAGING_DIR/"

echo "Copying static resources...(mail templates, rss template, opensearch template, i18n email locales)"
cp -ra ./server/static "$STAGING_DIR/server/static/"
cp -ra ./server/migrations "$STAGING_DIR/server/migrations/"
cp -ra ./plugins "$STAGING_DIR/plugins/"
cp -ra ./i18n "$STAGING_DIR/i18n/"

echo "Building CLI"
pnpm build:cli
cp .cli/index.js "$STAGING_DIR/server/gancio"

# a package.json specific for release is needed (without deps)
jq --arg v "$VERSION" '.version = $v' package.publish.json >"$STAGING_DIR/package.json"

cp .env.example "$STAGING_DIR/.env.example"
# cp docs/gancio.service "$STAGING_DIR/gancio.service"
