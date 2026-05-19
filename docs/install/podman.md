# Podman

## Setup
Make sure to have [Podman](https://podman.io/docs/installation) and [nginx](https://nginx.org/en/docs/install.html) installed:

```bash
sudo apt install podman uidmap slirp4netns fuse-overlayfs passt netavark aardvark-dns
```

Enable lingering for your user:

```bash
loginctl enable-linger `whoami`
```


### Quadlet
Setup Quadlet systemd unit file:

```bash
mkdir -p ~/.config/containers/systemd
echo '[Unit]
Description=Gancio

[Container]
Image=docker.io/cisti/gancio:2.0-alpha.5
PublishPort=127.0.0.1:13120:13120

[Service]
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target default.target' > ~/.config/containers/systemd/gancio.container
```


You'll need to [setup nginx as a proxy](./nginx) then you can point your web browser to your domain :tada:

<!-- 
## Upgrade

> warning "Backup your data"
> Backup your data is generally a good thing to do and this is especially true before upgrading.
> Don't be lazy and [backup](./install/backup.md) your data!


```bash
cd /opt/gancio # or where your installation is
docker-compose pull && docker-compose up -d
``` -->
