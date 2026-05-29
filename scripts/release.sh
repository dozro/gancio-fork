VERSION=$(npm pkg get version | xargs echo)

docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t cisti/gancio:"$VERSION" \
  --push .

docker buildx build \
  --target artifact \
  --output type=local,dest=./releases \
  .

gpg --pinentry-mode loopback --passphrase `pass underscore/pgp`  --detach-sign --local-user 5DAC477D5441B7A15ACBF680BBEB4DD39AC6CCA9 "./releases/gancio-$VERSION.tgz"
mv ./releases/* "./docs/public/releases/"

# symlink the latest release to nightly
rm -f "./docs/public/releases/nightly.tgz"
rm -f "./docs/public/releases/nightly.tgz.sig"
ln -s "./gancio-$VERSION.tgz" "./docs/public/releases/nightly.tgz"
ln -s "./gancio-$VERSION.tgz.sig" "./docs/public/releases/nightly.tgz.sig"

pnpm docs:build
rsync -avz docs/.vitepress/dist/ cisti.web:/var/www/gancio/v2/
