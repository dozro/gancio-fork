# Podman

Gancio runs rootless, managed by systemd with [Quadlet](https://docs.podman.io/en/latest/markdown/podman-systemd.unit.5.html). Optionally [Caddy](https://caddyserver.com/) runs next to it as reverse proxy and takes care of the TLS certificates.

## Prerequisites

Podman 5.0 or newer is required (e.g. Debian 13):

```bash
sudo apt install podman passt netavark aardvark-dns systemd-container
```

## Service user

Create a user to run the containers and let its services run without being logged in:

```bash
sudo useradd --create-home --shell /bin/bash gancio
sudo loginctl enable-linger gancio
```

Rootless containers need subordinate user and group ids. `useradd` usually assigns them, check that both files contain the user:

```bash
grep gancio /etc/subuid /etc/subgid
```

All following commands are run as this user, in a systemd login session:

```bash
sudo machinectl shell gancio@
```

## Gancio

The Quadlet files are installed to `~/.config/containers/systemd/gancio`, systemd generates the services on reload:

::: code-group
```bash [curl]
curl -fsSL --create-dirs --output-dir ~/.config/containers/systemd/gancio --remote-name-all https://gancio.org/podman/{gancio.container,gancio.network,gancio-data.volume}
systemctl --user daemon-reload
```
```bash [Podman 5.6+]
podman quadlet install --application gancio https://gancio.org/podman/{gancio.container,gancio.network,gancio-data.volume}
```
:::

```bash
systemctl --user start gancio
```

The volume `gancio-data` keeps configuration, database, uploads and logs. The image runs as user `node` (uid 1000), which Podman maps to one of the subordinate ids of the service user.

<<< @/public/podman/gancio.container{ini}

With this setup Gancio is only reachable inside the Podman network `gancio` at `gancio:13120`, to expose it directly to your host you can add a `PublishPort` directive in the `Container` section:

```ini
PublishPort=13120:13120
```

## Reverse proxy

### Caddy

Allow rootless containers to listen on ports 80 and 443:

```bash
echo 'net.ipv4.ip_unprivileged_port_start=80' | sudo tee /etc/sysctl.d/99-unprivileged-ports.conf
sudo sysctl --system
```

Configure your domain, Caddy gets a certificate on the first start:

```bash
mkdir -p ~/.config/caddy
echo 'events.example.org {
  reverse_proxy gancio:13120
}' > ~/.config/caddy/Caddyfile
```

::: code-group
```bash [Podman 5.6+]
podman quadlet install --application caddy https://gancio.org/podman/{caddy.container,caddy-data.volume}
```
```bash [curl]
curl -fsSL --create-dirs --output-dir ~/.config/containers/systemd/caddy --remote-name-all https://gancio.org/podman/{caddy.container,caddy-data.volume}
systemctl --user daemon-reload
```
:::

```bash
systemctl --user start caddy
```

### Your own proxy

Add `Network=gancio.network` to the Quadlet of your proxy container and proxy to `gancio:13120`.

Point your web browser to your domain to complete the setup :tada:

## Backup

Stop Gancio to get a consistent database and export its volume:

```bash
systemctl --user stop gancio
podman volume export gancio-data --output gancio-$(date +%Y-%m-%d-%H%M%S).tar
systemctl --user start gancio
```

To restore a backup, import it into the volume while Gancio is stopped:

```bash
podman volume import gancio-data gancio-2026-11-01-120000.tar
```

::: danger Be careful
Backups are critical, make sure to test your backup and restore process before relying on it.
:::

## Upgrade

Database migrations run on start, so [backup](#backup) your data before upgrading.

Check the running version:
```bash
podman exec gancio node -p "require('./package.json').version"
```

1. Set the new version in `~/.config/containers/systemd/gancio/gancio.container`:
```ini
Image=docker.io/cisti/gancio:2.0.0
```

2. Reload and restart, Podman pulls the new image:
```bash
systemctl --user daemon-reload
systemctl --user restart gancio
```
