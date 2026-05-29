VERSION=$(npm pkg get version | xargs echo)

docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t cisti/gancio:"$VERSION" \
  --push .

docker buildx build \
  --target artifact \
  --output type=local,dest=./releases \
  .

#cp ./releases/gancio.tgz "./docs/public/releases/gancio-v${VERSION}.tgz"
#mv ./releases/gancio.tgz ./docs/public/releases/latest.tgz

#pnpm docs:build
#rsync -avz docs/.vitepress/dist/ cisti.web:/var/www/gancio/v2/
