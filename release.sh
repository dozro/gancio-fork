#!/bin/bash

set -eu

usage() {
  echo "$0 [options]"
  echo "Options:"
  echo "      -d      Set release type to dev"
  echo "      -s      Set release type to stable (default)"
  echo "      -o  dir    Output a directory"
  echo "      -o  tgz    Output a tarball"
  echo "      -o  7z    Output a 7z archive (default)"
  echo "      -h      Show this help"
}

releaseType=stable
output=7z
while getopts 'dsho:' opt; do
  case "$opt" in
  h)
    usage
    exit 0
    ;;
  d)
    releaseType=dev
    ;;
  s)
    releaseType=stable
    ;;
  o)
    output=$OPTARG
    if [ "$output" != dir ] && [ "$output" != tgz ] && [ "$output" != 7z ]; then
      echo "Invalid output type ($output): it must literally be either 'dir' or 'tgz' or '7z'" >&2
      exit 2
    fi
    ;;
  \?)
    usage >&2
    exit 2
    ;;
  esac
done

cd "$(dirname "$0")"
gitRepo=$(realpath .)

# new release, changelog, etc..
# npx standard-version
# git push --follow-tags
if [ "$releaseType" = dev ]; then
  version="dev-$(date +%F)-$(git describe --always)"
  destDir="$gitRepo"
else
  version=$(npm pkg get version | xargs echo)
  destDir=$(realpath ./docs/public/releases)
fi
destArchive="${destDir}/gancio-${version}.${output}"
echo $destArchive

PKG_BASE=$(mktemp --tmpdir -d gancio_build.XXXXXX)
PKG_MAIN="${PKG_BASE}/${version}"
if [ "$output" = dir ]; then
  trap 'echo Your output dir is at ${PKG_BASE}' EXIT
else
  trap 'rm -rf ${PKG_BASE}' EXIT
fi
mkdir "${PKG_MAIN}"

# clean and reinstall dependencies
rm -fr node_modules
bun install

# clean past artifacts
npx nuxi cleanup

# build web UI
npx nuxi build

mkdir -p "${PKG_MAIN}/uploads"
# mkdir -p "${PKG_MAIN}/prisma"

# nuxt built app
cp -ra .output/ "${PKG_MAIN}/nuxt/"

# db migrations
cp -ra ./server/migrations "${PKG_MAIN}/nuxt/server/migrations/"

# small cli utility
# cp -ra cli "${PKG_MAIN}/.output/server/cli/"
# cp gancio.js "${PKG_MAIN}/.output/server/gancio.js"

# all locales
cp -ra i18n "${PKG_MAIN}/nuxt/server/i18n/"

# default db
# cp gancio.sqlite.rel "${PKG_MAIN}/gancio.sqlite"

# example env
cp .env.example "${PKG_MAIN}/.env"

# default resources
cp ./uploads/logo.png "${PKG_MAIN}/uploads/"
cp ./uploads/fallbackimage.svg "${PKG_MAIN}/uploads/"
cp ./uploads/headerimage.svg "${PKG_MAIN}/uploads/"

# plugins
cp -ra ./gancio_plugins "${PKG_MAIN}/nuxt/server/plugins/"

# cp package.json bun.lock yarn.lock .env.example "${PKG_MAIN}/"
# cp gancio.service "${PKG_MAIN}/"

if [ "$output" = tgz ]; then
  mkdir -p "$destDir"
  tar -cvzf "${destArchive}" -C "${PKG_BASE}" .
elif [ "$output" = 7z ]; then
  mkdir -p "$destDir"
  pushd "${PKG_BASE}"
  7z a "${destArchive}" .
  popd
fi

if [ "$releaseType" = stable ]; then
  if [ "$output" = tgz ]; then
    rm -f "${destDir}/gancio-latest.tgz"
    cp "${destArchive}" "${destDir}/gancio-latest.tgz"
  fi

  yarn run docs:build
  # rsync -vr docs/.vitepress/dist/ cisti.web:/var/www/gancio/v2
fi
