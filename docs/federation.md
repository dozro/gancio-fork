---
layout: default
title: Federation
permalink: /federation
nav_order: 9
---

## Federation / ActivityPub

Gancio largely follows ActivityPub's server-to-server specification.


## Supported federation protocols and standards

- [ActivityPub](https://www.w3.org/TR/activitypub/) (Server-to-Server)
- [WebFinger](https://webfinger.net/)
- [HTTP Signatures](https://datatracker.ietf.org/doc/html/draft-cavage-http-signatures)
- [NodeInfo](https://nodeinfo.diaspora.software/)

## Supported FEPs

- [FEP-f1d5: NodeInfo in Fediverse Software](https://codeberg.org/fediverse/fep/src/branch/main/fep/f1d5/fep-f1d5.md)
- [FEP-67ff: FEDERATION.md](https://codeberg.org/fediverse/fep/src/branch/main/fep/67ff/fep-67ff.md)
- [FEP-fb2a: Actor metadata](https://codeberg.org/fediverse/fep/src/branch/main/fep/fb2a/fep-fb2a.md)
- [FEP-2677: Identifying the Application Actor](https://codeberg.org/fediverse/fep/src/branch/main/fep/2677/fep-2677.md)
- [FEP-8a8e: A common approach to using the Event object type](https://fediverse.codeberg.page/fep/fep/8a8e)

## ActivityPub

Each instance has only one [AP Actor](https://www.w3.org/TR/activitypub/#actors) of type `Application` named `events@instance.tld` by default (was `relay` before 1.24), which publishes each event as [Event](https://www.w3.org/TR/activitystreams-vocabulary/#dfn-event) type.  
Each AP enabled software could decide how to interact with coming events, e.g. on Mastodon and forks you can see it with minimal information, with Friendica events are added into your own calendar, GoToSocial does not support [Event](https://www.w3.org/TR/activitystreams-vocabulary/#dfn-event) type.

We are considering the introduction of other `Actor` but they will not be linked to users, rather to places, tags or collections.
There are no personal timeline of people you follow, everyone has a sort of local timeline of the instance, it’s an anti filter-bubble feature.

Since v1.10.0 each instance could follow other instances or actors (`Admin > Federation > Add trusted node`) and use the events incoming from the federation to fill choosen collections (`Admin > Collections`).

Note that events coming from the federation will be removed after the end.

All federation's related operations uses `/federation` as endpoint. You can disable it via a specific setting (`Admin > Federation > Disable federation`).


### Supported operations

| **Operation** | **Since** | **Note** |
| Follow Gancio from Fediverse | <span class='label label-yellow'>0.15.0</span> |  |
| Send an Event  |  <span class='label label-yellow'>0.15.0</span>  | Sent as [Event](https://www.w3.org/TR/activitystreams-vocabulary/#dfn-event) type.|
| Receive a Note | <span class='label label-yellow'>0.21.0</span> | Adds images, audio and notes to an event with a simple reply |
| Delete a Note | <span class='label label-yellow'>0.21.0</span> |
| Update a Note | <span class='label label-yellow'>0.21.0</span> |
| Follow an Actor | <span class='label label-yellow'>1.10.0</span> | |
| Receive an Event | <span class='label label-yellow'>1.10.0</span> | 
| Update an Event | <span class='label label-yellow'>1.10.0</span> |
| Delete an Event | <span class='label label-yellow'>1.10.0</span> |


### Moderation

- Hide or remove a remote event 
- Block a remote user
- Block a remote instance

### Notes on [FEP-8a8e implementation](https://fediverse.codeberg.page/fep/fep/8a8e)

The minimum `REQUIRED` properties for an Event are `name`, `startTime` and `endTime`

```json
{
  name: "Event name", 
  startTime: "2024-01-01T00:00:00Z", 
  endTime: "2024-01-01T01:00:00Z"
}
```
`startTime` and `endTime` are required to be in ISO 8601 format and must include a timezone designator (e.g., "Z" for UTC or an offset like "+01:00").

> info "Note"  
> To maximize interoperability across federated systems, **Gancio is forgiving in what it consumes but exacting in what it produces**, for example when an event without `endTime` is received, Gancio will accept generate an `endTime` by adding a default duration (3 hour) to the `startTime`.