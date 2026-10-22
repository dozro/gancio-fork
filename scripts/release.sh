PRODUCTION=${1:-"false"}
VERSION=$(npm pkg get version | xargs echo)

if [ "$PRODUCTION" = "false" ]; then
	echo "Test mode: building docker image for local testing only (image cisti/gancio:test)"
  docker buildx build \
    -t cisti/gancio:test \
    --load .

  docker buildx build \
    --target artifact \
    --output type=local,dest=./releases \
    .

  echo "Test the image with 'mkdir -p ./data && sudo chown 1000:1000 ./data && docker run  -p 13120:13120 -v ./data:/app/data -it --rm cisti/gancio:test'"
  echo "Test the package with 'npm install -g ./releases/gancio-$VERSION.tgz' and then 'gancio'"
  exit 0
fi

DATE=$(date "+%d %B %Y")
npm pkg set date="$DATE"

docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t cisti/gancio:"$VERSION" \
  -t cisti/gancio:beta \
  --push .

docker buildx build \
  --target artifact \
  --output type=local,dest=./releases \
  .

gpg --pinentry-mode loopback --passphrase `pass underscore/pgp`  --detach-sign --local-user 5DAC477D5441B7A15ACBF680BBEB4DD39AC6CCA9 "./releases/gancio-$VERSION.tgz"
mv ./releases/* "./docs/public/releases/"

# symlink the latest release to beta
rm -f "./docs/public/beta.tgz"
rm -f "./docs/public/beta.tgz.sig"
ln -s "./releases/gancio-$VERSION.tgz" "./docs/public/beta.tgz"
ln -s "./releases/gancio-$VERSION.tgz.sig" "./docs/public/beta.tgz.sig"

pnpm docs:build
rsync -avz docs/.vitepress/dist/ cisti.web:/var/www/gancio/
