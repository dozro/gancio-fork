# Building the project
The process of building the project is as follows:

`./scripts/release.sh`

This script will build the project and create:

- a docker image named `cisti/gancio:test`  
you can test it by running 'mkdir -p ./data && sudo chown 1000:1000 ./data && docker run -v ./data:/app/data -it --rm cisti/gancio:test`

- an npm package in the `releases` folder  
you can install it by running 'npm install -g ./releases/gancio-<version>.tgz' and then just 'gancio'

# Release process

## Commit and tag a new version
`npx commit-and-tag --prerelease --dry-run`

(remove the `--dry-run` flag to actually commit and tag and the `--prerelease` flag if you want to make a stable release)
this will change the version in package.json, add changes to CHANGELOG.md and commit and tag the new version.


`./script/release.sh true` 