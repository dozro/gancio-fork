---
title: "A new plugin system in version 2"
date: 2026-10-29
editLink: false
aside: false
next: false
---

With Gancio 2.0 comes a new and improved plugin system.

The first and more important thing you need to know is that plugins developed for v1 **won't be compatible** with the v2. However there's a good news for plugin maintainers: updating existing plugins should require only a few **small changes**.

The main change is that now the plugin should export a function instead of an object. This function will provide the plugin all needed services from Gancio making it easier to develop and to integrate with the internals.

Read the [plugins documentation](/dev/plugins) to see some examples.

## Features

In terms of features, we've introduced a new interface for the plugins administration panel!

![Plugins list](/dev/plugins_admin_panel.png)


Also the plugins configuration view debuts with a new interface, easier to read and understand for new instance administrators. And mobile friendly!

![Plugin settings](/dev/plugin_settings.png)

There is a new input type `URL`, that only let's the user save valid URLs. The `NUMBER` type now has optional `min` and `max` options and a better numeric input.

Along with these new features, the core system of plugins has been completely rewritten to make it more robust and reliable, with the possibility to keep expanding it in the future and to use [exposed services](/dev/plugins#exposed-services-help-needed) directly from the core.

Finally, we've added the ability to interact with plugins via the CLI using the `onCLI` hook.


## Included plugins
Gancio already comes with a couple of plugins included in the default installation (this list will hopefully be longer in a while):

- **Feed**:
Get events from specified ICS/iCal feed.

- **Webhook**:
Allows Gancio to notify external services about events through webhooks, making it easier to integrate with other platforms and automate workflows (small suggestion here: there is an easy-to-use debian package called webhook to experiment with).

## Write custom plugins
It is working again the possibility to load custom plugins from a local path (by default `./plugins`), this is the way to install and develop custom plugins.
Note that the community has developed additional plugins to connect Gancio with other platforms that needs a review so any help with testing is appreciated:

- [Telegram Bridge](https://framagit.org/bcn.convocala/gancio-plugin-telegram-bridge/-/merge_requests/12)
- [Discord Bridge](https://git.gay/kviriem/gancio-plugin-discord)
- [Bluesky Bridge](https://framagit.org/coegho/gancio-plugin-bluesky-bridge)
- [Nostr](https://framagit.org/les/gancio/-/work_items/681) (just an idea)


As always, thanks a lot to everyone who contributes to making this possible!