import { describe, expect, it } from 'vitest'
import { isSameOrigin } from '../../server/helpers'

describe('Helpers', () => {
  it('should check same origin', () => {
    expect(isSameOrigin('https://a.com', 'https://a.com')).toBe(true)
    expect(isSameOrigin('https://a.com', 'https://a.com/')).toBe(true)
    expect(isSameOrigin('https://a.com', 'https://a.com:443')).toBe(true)

    expect(isSameOrigin('https://a.com', 'https://b.com')).toBe(false)
    expect(isSameOrigin('https://a.com', 'http://a.com')).toBe(false)
    expect(isSameOrigin('https://a.com', 'https://a.com:8443')).toBe(false)
    expect(isSameOrigin('https://a.com', 'https://a.com.evil.com')).toBe(false)
  })
})
