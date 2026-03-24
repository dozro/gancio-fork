import { describe, expect, it } from 'vitest'


describe('Tags', () => {
  it('should normalize tags with accents, hashtags, trim, etc..', async () => {
    const { normalizeTag } = await import('../../server/services/tags')
    expect(normalizeTag('NoTAV')).toBe('notav')
    expect(normalizeTag('Café')).toBe('cafe')
    expect(normalizeTag('naïve')).toBe('naive')
    expect(normalizeTag('façade')).toBe('facade')
    expect(normalizeTag('Straße')).toBe('strasse')
    expect(normalizeTag('İstanbul')).toBe('istanbul')
    expect(normalizeTag('  #Test  ')).toBe('test')
    expect(normalizeTag('música')).toBe('musica')
  })
})