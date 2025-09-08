import { describe, expect, it } from "vitest"
import { fetch, setup } from '@nuxt/test-utils/e2e'

import { parseIcsData } from  "../server/utils/icsparser.js"
const base_url = 'http://localhost:13120'

await setup({ host: base_url })

const singleEventIcs = `
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Sample ICS Test//NONSGML v1.0//EN
BEGIN:VEVENT
UID:12345
SUMMARY:Single Event Test
DESCRIPTION:This is a single test event
LOCATION:Test Location
DTSTART:20250311T120000Z
DTEND:20250311T140000Z
END:VEVENT
END:VCALENDAR
`

const multipleEventsIcs = `
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Sample ICS Test//NONSGML v1.0//EN
BEGIN:VEVENT
UID:12345
SUMMARY:First Event
DESCRIPTION:First event description
LOCATION:Location A
DTSTART:20250311T120000Z
DTEND:20250311T140000Z
END:VEVENT
BEGIN:VEVENT
UID:67890
SUMMARY:Second Event
DESCRIPTION:Second event description
LOCATION:Location B
DTSTART:20250312T150000Z
DTEND:20250312T170000Z
END:VEVENT
END:VCALENDAR
`

  describe('ICSParser', () => {
    it('should parse a single event correctly', () => {
      const events = parseIcsData(singleEventIcs)
  
      expect(events.length).toBe(1)
      expect(events[0].title).toBe('Single Event Test')
      expect(events[0].description).toBe('This is a single test event')
      expect(events[0].location).toBe('Test Location')
      expect(events[0].start_datetime).toBeGreaterThan(0)
      expect(events[0].end_datetime).toBeGreaterThan(events[0].start_datetime)
    })
  
    it('should parse multiple events correctly', () => {
      const events = parseIcsData(multipleEventsIcs)
  
      expect(events.length).toBe(2)
  
      // First event
      expect(events[0].title).toBe('First Event')
      expect(events[0].description).toBe('First event description')
      expect(events[0].location).toBe('Location A')
      expect(events[0].start_datetime).toBeGreaterThan(0)
      expect(events[0].end_datetime).toBeGreaterThan(events[0].start_datetime)
  
      // Second event
      expect(events[1].title).toBe('Second Event')
      expect(events[1].description).toBe('Second event description')
      expect(events[1].location).toBe('Location B')
      expect(events[1].start_datetime).toBeGreaterThan(0)
      expect(events[1].end_datetime).toBeGreaterThan(events[1].start_datetime)
    })
  
    it('should return an empty array if no events are found', () => {
      const emptyIcs = `BEGIN:VCALENDAR\nVERSION:2.0\nEND:VCALENDAR`
      const events = parseIcsData(emptyIcs)
  
      expect(events.length).toBe(0)
    })
  
    // TODO: test for invalid ICS format
    // TODO: test for facebook events ics standards (organizer, etc)
  })
  
  describe('ICS API (/api/ics-parser)', () => {
    it('should return 1 event from valid input', async () => {
      const ret = await fetch('/api/ics-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ icsText: singleEventIcs,  includePastEvents: true }) })
  
      expect(ret.ok).toBe(true)
      const data = await ret.json()
      expect(data.events.length).toBe(1)
      expect(data?.events[0].title).toBe('Single Event Test')
      expect(data?.events[0].location).toBe('Test Location')
    })
  
    it('should return 400 if no icsText is provided', async () => {
      const ret = await fetch('/api/ics-import', { method: 'POST', body: "{}" })
      expect(ret.status).toBe(400)
    })

    it('should skip events when no includePastEvents flag provided', async () => {
    const events = parseIcsData(multipleEventsIcs, false)
    expect(events.length).toBe(0)

    const ret = await fetch('/api/ics-import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ icsText: singleEventIcs }) })

    expect(ret.status).toBe(200)
    const data = await ret.json()
    expect(data.events.length).toBe(0)    
  })
})

describe('ICS output', () => {
  it('should return a valid ICS feed', async () => {
    const icsString = await fetch('/feed/ics')

    expect(icsString.ok).toBe(true)
    const data = await icsString.text()
    expect(data).toContain('BEGIN:VCALENDAR')
    expect(data).toContain('VERSION:2.0')
    expect(data).toContain('END:VCALENDAR')
  })
  
  it('should return a valid ics for each event detail', async () => {
    const icsString = await fetch('/api/event/detail/1?format=ics')

    expect(icsString.ok).toBe(true)
    expect(icsString.headers.get('content-type')).toContain('text/calendar')
    const data = await icsString.text()
    expect(data).toContain('BEGIN:VEVENT')
    // expect(data).toContain('SUMMARY:Single Event Test')
    // expect(data).toContain('LOCATION:Test Location')
    expect(data).toContain('END:VEVENT')
  })
})