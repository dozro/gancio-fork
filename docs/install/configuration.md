# Configuration
`gancio` configuration is done during installation process but you can change it editing the configuration file.
The configuration file shoud be a `.json` or a `.js` file and could be specified using the `--config` flag.

- <small>eg. `gancio start --config ./config.json`</small>

## Server

```json
"server": {
    "host": "localhost",
    "port": 13120
}
```

## Database
DB configuration, look [here](https://sequelize.org/v6/class/src/sequelize.js~Sequelize.html#instance-constructor-constructor) for options.
```json
  "db": {
    "dialect": "sqlite",
    "storage": "/tmp/db.sqlite"
  }
```
## Upload path
Where to save images  
`"upload_path": "./uploads"`

## Plugins path
Where to search for [plugins](/usage/plugins)  
`"plugins_path": "./plugins"`

## User locale
Probably you want to modify some text for your specific community, that's
why we thought the `user_locale` configuration: you can specify your version of
each string of **gancio** making a directory with your locales inside.
For example, let's say you want to modify the text shown during registration:  
`mkdir /opt/gancio/user_locale`  

put something like this in `/opt/gancio/user_locale/en.json` to override the registration description in
english:  
```json
{
  "register": {
    "description": "My new registration page description"
  }
}
```  
and then point the `user_locale` configuration to that directory (in your `config.json`):  
```json
"user_locale": "/opt/gancio/user_locale"
```  
Watch [here](https://framagit.org/les/gancio/tree/master/locales) for a
list of strings you can override.

::: warning Restart needed
Note that a restart is needed when you change user_locale's content.
:::

## Allowed private addresses
Gancio fetches URLs given by users (e.g. importing an ICS from a URL or the image of an event) only from
public addresses on the default ports, so that nobody can use your instance to reach your internal network.  
If you need exceptions (e.g. your DNS resolves public names to internal addresses), list host names,
IP addresses or subnets, comma separated and with an optional port. Without a port only the default ports are allowed.  
`"allowed_private_addresses": "localhost:13120,192.168.1.0/24,[fd00::1]:8080"`  
or with the `GANCIO_ALLOWED_PRIVATE_ADDRESSES` environment variable.

::: danger
Listed targets become reachable by anyone able to make your instance fetch a URL.
:::

## Proxy
Outgoing requests go through an HTTP(S) proxy with the
[built-in proxy support](https://nodejs.org/api/http.html#built-in-proxy-support) of Node.js.
These variables must be set in the environment of the process (not in .env):
```sh
NODE_USE_ENV_PROXY=1
HTTP_PROXY=http://proxy.example.com:3128
HTTPS_PROXY=http://proxy.example.com:3128
NO_PROXY=localhost,.internal.example.com
```
The docker image and the systemd unit already set `NODE_USE_ENV_PROXY=1`, set it to `0` to disable the proxy.
