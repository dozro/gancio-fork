---
layout: default
title: Collections
permalink: /usage/collections
nav_order: 2
parent: Usage
---

# Collections
{: .no_toc }

Collections are groupings of events filtered by tags, places or federated instances.

These collections of events can be used in different ways and each one will have a specific page where the events that are part of it will be collected.

## Creating Collections

There is a specific section in the administration panel called "Collections" where you can create new collections and manage existing ones.

Then, simply select the characteristics of the events you want to include in that collection.
The selectable characteristics are tags, locations, and federated instances.

You can add multiple filters and for each filter, all selected characteristics will be considered inclusive (e.g. selecting multiple tags will include all events that contain **at least** one of the selected tags).

If you add additional filters with other characteristics, these will be considered exclusive (selecting a tag in a second filter will include all events that pass through the first filter **and also have** this second tag).

It is easier to explain with examples. 

## Use collection

Each collection has a specific page where the events that are part of it will be shown.

- page
- rss
- ics
- widget
- json


## Use cases

### Grouping events by "organizer"
In Turin (Italy), we have a self-managed radio station ([Radio Blackout](https://radioblackout.org)) that hosts some events at its headquarters, but some benefit events for the radio station are hosted by other venues.
Given the need to group together the radio station's benefit events (regardless of location), it is possible to create a collection for this purpose specifying two filters, the first one being the place "Radio Blackout" and the second one being the tags related to the radio station's benefit events (e.g. "blackout", "radio blackout", "benefit radio").


### Grouping events thematically
Given the international situation, what better opportunity to create an anti-militarist node that collects related events?
This can be done by following trusted sources and selecting events with relevant tags (e.g., Gaza, Ukraine, genocide, war).
Obviously, it would be important to agree on which tags to use, so in this case I suggest a classic #noarmy.


### Grouping events by location
Some nodes relate to a specific geographical area large enough to group events by portions of that area:
the Tuscan node, for example ([lapunta.org](https://lapunta.org)), collects events from an entire region, so in order to display specific cities, they decided to create collections for the most important one (Florence, Livorno, Pisa, Empoli).
