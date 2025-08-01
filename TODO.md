- [ ] DateInput component
- [ ] l'add!
- [ ] l'edit!
- [ ] documentazione
  - [ ] installation
  - [ ] configuration
  - [ ] add events
  - [ ] recurring event
  - [ ] rss feed
  - [ ] ics feed
  - [ ] web component
  - [ ] wp gancio
  - [ ] ap interaction
  - [ ] trusted nodes
  - [ ] Administration
  - [ ] plugins
  - [ ] moderation
  - [ ] API
- [ ] FAQ
- [x] l'autenticazione si disconnette spesso
- [ ] sistemare l'editor
- [ ] useState dei settings e' deep reactive? (ad esempio quando cambio le opzioni)
- [ ] i18n e' un bordello (sto provando -edge)!
- [ ] nei settings c'e' da riguardare tutto
- [ ] il setup!
- [ ] federazione!
- [ ] build, docker, distribution!
- [ ] /headerimage.png did not resolve at build time (just a warning? same with /logo.png, how can I have a default asset but customizable?)
- [ ] custom 404 page!! (https://test.cisti.org/p/non_esiste)

- [ ] rename collection_in_home in 


# 3. Documentation
a. Completely review and update Usage section in website (Installation, Configuration, Add Events, Recurring Event, RSS Feed, ICS Feed, WebComponent, WP Gancio, AP Interaction, Trusted Nodes, Plugins, API, Moderation)
b. Review and Update Third party authentication documentation
c. Review and Update API documentation


# 4. Implement HTTP Signatures / LD Signatures
a. Enhance HTTP Signature verification for generic AP messages
b. Implement LD Signatures for “boosted” events
c. Implement LD Signatures verification for coming “boosted” events.


# 7. Remove technical debt
a. Create a clear full stack dependencies upgrade plan (Sequelize, Nuxt3, Vue3, Vuetify3, Vuex>Pinia?, Express>Nitro?)
b. Refactoring code making agnostic/reusable module/controllers (e.g. decoupling from express)
c. Migrating from Nuxt2 to Nuxt3
d. Rewrite unsupported module porting and support for modules with breaking change (nuxt/auth, nuxt/i18n, nuxt/sitemap)


Il porting da nuxt2 a nuxt3 (in realta' nuxt4!) e' stato piu' complesso del previsto.
Nuxt 3 is a complete rewrite of Nuxt 2, and also based on a new set of underlying technologies.

There are significant changes when migrating a Nuxt 2 app to Nuxt 3, some of these significant changes include:

Moving from Vue 2 to Vue 3, including defaulting to the Composition API and script setup.
il grosso del lavoro e' stato il porting da vue2 a vue3 per i componenti UX, sono cambiate profondamente le API e la struttura, ho colto l'occasione per introdurre typescript.

Moving from webpack 4 and Babel to Vite or webpack 5 and esbuild.

Moving from express to h3/nitro

Moving from a runtime Nuxt dependency to a minimal, standalone server compiled with nitropack.

la documentazione di nuxt ha una sezione molto corposa sul porting ma leggendo tutte le esperienze di chi e' gia' fatto un lavoro simile tutti consigliano di partire da 0, ed e' esattamente quello che ho fatto prima su un branch temporaneo e successivamente cogliendo l'occasione per spostare il branch principale da master a main.

inoltre quest'anno e' gia' uscito nuxt4 e siccome l'aggiornamento non era breaking come dal 2 al 3 ho deciso di fare il porting direttamente al 4.

il framework UI utilizzato e' vuetify, il porting a vuetify3 e' stato abbastanza indolore (i componenti sono abbastanza retrocompatibili, sono cambiate poche proprieta')

il backend e' invece cambiato parecchio passando da express a nitro, abbiamo aggiornato l'orm utilizzato da sequelize6 a sequelize7, anche qui ci sono grandi modifiche, in particolare come si dichiarano i modelli, la gestione delle migrazioni (non esiste un tool ancora e bisogna farlo manualmente) e ci sono ancora piccoli bug che sono stati segnalati ma nel complesso non male.




https://github.com/sequelize/sequelize/issues/17818

