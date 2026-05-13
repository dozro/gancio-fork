#!/bin/bash

# should build the package

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
	VERSION="dev-$(date +%F)-$(git describe --always)"
	destDir="$gitRepo"
else
	VERSION=$(npm pkg get version | xargs echo)
	destDir=$(realpath ./docs/releases)
fi
destArchive="${destDir}/gancio-${VERSION}.${output}"
echo $destArchive

PKG_BASE=$(mktemp --tmpdir -d gancio_build.XXXXXX)
PKG_MAIN="${PKG_BASE}/${VERSION}"
if [ "$output" = dir ]; then
	trap 'echo Your output dir is at ${PKG_BASE}' EXIT
else
	trap 'rm -rf ${PKG_BASE}' EXIT
fi
mkdir "${PKG_MAIN}"

# clean and reinstall dependencies
rm -fr node_modules
pnpm install

PKG_MAIN="./.publish"
rm -rf "${PKG_MAIN}"
mkdir -p "${PKG_MAIN}"

# clean past artifacts
npx nuxi cleanup

# build web UI
npx nuxi build
rsync -aL .output/ "${PKG_MAIN}/"

# build CLI
pnpm build:cli

# static resources
echo "Copying static resources...(mail templates, rss template, opensearch template, i18n email locales)"
cp -raL ./server/static "${PKG_MAIN}/server/static/"
cp -ra ./server/migrations "${PKG_MAIN}/server/migrations/"
cp -ra ./plugins "${PKG_MAIN}/plugins/"
cp -ra ./i18n "${PKG_MAIN}/i18n/"

# CLI
cp .cli/index.js "${PKG_MAIN}/server/gancio"

# a package.json specific for release is needed (without deps)
jq --arg v "$VERSION" '.version = $v' package.publish.json > "${PKG_MAIN}/package.json"
# ln -s "nuxt/server/package.json" "${PKG_MAIN}/package.json"

# example env
cp .env.example "${PKG_MAIN}/.env"
cp config.example.json "${PKG_MAIN}/config.example.json"
cp docs/gancio.service "${PKG_MAIN}/"

npm pack "${PKG_MAIN}"

# if [ "$output" = tgz ]; then
# 	mkdir -p "$destDir"
# 	tar -cvzf "${destArchive}" -C "${PKG_BASE}" .
# elif [ "$output" = 7z ]; then
# 	mkdir -p "$destDir"
# 	pushd "${PKG_BASE}"
# 	7z a "${destArchive}" .
# 	popd
# fi

# if [ "$releaseType" = stable ]; then
# 	if [ "$output" = tgz ]; then
# 		rm -f "${destDir}/gancio-latest.tgz"
# 		cp "${destArchive}" "${destDir}/gancio-latest.tgz"
# 	fi

# 	pnpm run build:doc
# 	# rsync -vr docs/.vitepress/dist/ cisti.web:/var/www/gancio/v2
# fi
