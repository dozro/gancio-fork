---
layout: default
title: Plugins
permalink: /dev/plugins
nav_order: 2
parent: Hacking
---

## Plugins
Plugins allow you to extend Gancio features and integrate it with other services.
With plugins you can:
- react to events related actions (create, update, delete) for example to send a notification to another service.
- expose your own API endpoints to be used by other services or your own frontend.
- create your own database tables and use them to store custom data.
- add your own settings to the admin panel and use them in your plugin
- expose a CLI command to be used in the terminal

> warning "Warning"
> With v2 we are introducing a new plugin system that is not compatible with the old one, so if you have an old plugin you will need to rewrite it (the basic syntax is pretty the same).


## Basics
To start developing a plugin you can copy the [example plugin](https://framagit.org/les/gancio/plugins/example) and modify it as you need.

A plugin is essentially an `index.ts` file inside its own path in `./plugins`, e.g. `./plugins/my-example-plugin/index.ts`

```typescript
import type { GancioContext, GancioPlugin } from '../server/services/plugins'
export default ({ log, db, publicSettings, services }: GancioContext): GancioPlugin => ({
  manifest: {
    name: 'An example plugin',
    author: 'lesion',
    url: 'https://framagit.org/les/gancio',
    description: 'An example plugin to show how to create a plugin for Gancio',
  }
})
```

Plugins should be inside `./plugins` directory but you can specify another location using [`plugins_path`](https://gancio.org/install/config#plugins-path) configuration.

## Plugin details
A plugins **MUST** expose a `manifest` key where to specify its details:

```js
module.exports = {
  configuration: {
    name: 'Example',
    author: 'lesion',
    url: 'https://framagit.org/les/gancio/plugins/gancioPluginExample.js',
    description: 'Example plugin',
    settings: {
      my_plugin_string_setting: {
        type: 'TEXT',
        description: 'My plugin string setting',
        required: true,
        hint: 'My plugin setting support <strong>html too</strong>'
      },
      enable_this_feature_in_my_plugin: {
        type: 'CHECK',
        description: 'My plugin best feature',
        required: true,
        hint: 'This feature is super dupe, enable it!'
      },
      min_post: {
        type: 'NUMBER',
        description: 'it supports number too'
      },
      my_default_language: {
        description: 'My default language',
        type: 'LIST',
        items: ['it', 'en', 'fr']
      }
    }
  }
}
```

[![/assets/plugins/settings.png](/assets/plugins/settings.png)](/assets/plugins/settings.png){: data-fancybox="group" data-caption="Home"}


## Load a plugin
When a plugin is enabled by an administrator, Gancio will call the `load` method if specified:

```js
load ({ settings: gancio_settings, db, helpers, log}, settings) {

  // access to your plugin local settings
  console.info('Your local settings are in ', settings)
  console.info(`For example, you can access to your default language setting by using ${settings.my_default_language}`)

  // access to gancio settings
  console.info(`Gancio settings are in ${gancio_settings}, e.g. ${gancio.settings.baseurl}`)

  // log something
  log.warn('This is a log entry from my example plugin')

  // use the DB (since 1.6.14)
  console.info(db.models.findAll())
  console.info(db.query('CREATE TABLE IF NOT EXISTS myPluginTable'))
}
```

## Expose an API <span class='label label-yellow'>since 1.6.4</span>

Plugins could have public HTTP endpoints by exposing an express Router in routeAPI object.

```js
const express = require('express')
const routeAPI = express.Router()

routeAPI.get('/test', (req, res) => {
  res.json('WOW!')
})
```

This endpoint will be exposed at `<your_instance>/api/plugin/<your_plugin_name>/test`
  

## Access to DB <span class='label label-yellow'>since 1.6.4</span>
TODO

## Helpers <span class='label label-red'>DOCUMENTATION NEEDED</span>
- randomString
- sanitizeHTML
- queryParamToBool

## React to events

```js
  onEventCreate (event) {
    const eventLink = `${plugin.gancio.settings.baseurl}/event/${event.slug}`
    if (!event.is_visible) {
      console.error(`Unconfirmed event created: ${event.title} / ${eventLink}`)
    } else {
      console.error(`Event created: ${event.title} / ${eventLink}`)
    }
  },

  onEventUpdate (event) {
    console.error(`Event "${event.title}" updated`)
  },

  onEventDelete (event) {
    console.error(`Event "${event.title}" deleted`)
  }
```


