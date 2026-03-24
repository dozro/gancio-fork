import { describe, expect, it } from 'vitest'
// import { connect } from '../../server/services/db'
import { cleanDatabase } from '../api/setup'

await cleanDatabase()
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
  
  it('should find or create tags removing duplicates (taking the first occurrence)', async () => {
    const { findOrCreateTags } = await import('../../server/services/tags')
    const tags = ['Tag1', 'tag1', 'TAG1']
    const result = await findOrCreateTags(tags)
    console.error(result)
    expect(result).toHaveLength(1)
    expect(result[0].tag).toBe('Tag1')
  })
  
  it('should return existing tag when found', async () => {
    const { findOrCreateTags } = await import('../../server/services/tags')
    const tags = ['TAG1']
    const result = await findOrCreateTags(tags)
    expect(result).toHaveLength(1)
    expect(result[0].tag).toBe('Tag1')
  })
  
  it('should create new tag when not found', async () => {
    const { findOrCreateTags } = await import('../../server/services/tags')
    const tags = ['NewTag']
    const result = await findOrCreateTags(tags)
    expect(result).toHaveLength(1)
    expect(result[0].tag).toBe('NewTag')
  })
  
  it('should return multiple tags when found', async () => {
    const { findOrCreateTags } = await import('../../server/services/tags')
    const tags = ['tAg1', 'tag2']
    const result = await findOrCreateTags(tags)
    expect(result).toHaveLength(2)
    expect(result[0].tag).toBe('Tag1')
    expect(result[1].tag).toBe('tag2')
  })
})