import { describe, expect, it, vi } from 'vitest'
import { pluginController, connect } from '../../server/services'
import path from 'node:path'

vi.mock('/plugins/example', () => ({ default: () => ({ manifest: { name: 'test' }, load: vi.fn() }) }))
vi.mock('/plugins/example2', () => ({ default: () => ({ manifest: { name: 'test_2' }, load: vi.fn() }) }))
vi.mock('/plugins/example3', () => ({ default: () => ({ manifest: { name: 'test_3' }, load: vi.fn(), onTest: vi.fn() }) }))

await connect()
describe('Plugin', () => {
  it('should not load an unknown plugin', async () => {
    const plugin = pluginController.initPlugin('./plugins/nonexistent.js')
    await expect(plugin).rejects.toThrow()
  })

  it('should load a plugin', async () => {
    const plugin = await pluginController.initPlugin(path.resolve(__dirname, './plugins/base'))
    expect(plugin?.manifest.name).toBe('base')
  })

  it('should not load a plugin twice', async () => {
    // await pluginController.initPlugin(path.resolve(__dirname, './plugins/base'))
    const plugin = pluginController.initPlugin(path.resolve(__dirname, './plugins/base'))
    await expect(plugin).rejects.toThrow('Plugin base already loaded')
  })

  // should get a plugin by name
  it('should get a plugin by name', async () => {
    const plugin = pluginController.getPlugin('base')
    expect(plugin?.manifest.name).toBe('base')
  })

  it('should not load a plugin if not enabled', async () => {
    const plugin = await pluginController.initPlugin('/plugins/example')
    expect(plugin?.manifest.name).toBe('test')
    expect(plugin?.load).not.toHaveBeenCalled()
  })

  it('should load a plugin if enabled', async () => {
    const plugin = await pluginController.initPlugin('/plugins/example2')
    await pluginController.togglePlugin('test_2')
    expect(plugin?.load).toHaveBeenCalled()
  })

  it('should have a list of loaded plugins', async () => {
    expect(pluginController.plugins.length).toBe(3)
    expect(pluginController.plugins[0]?.manifest.name).toBe('base')
    expect(pluginController.plugins[1]?.manifest.name).toBe('test')
    expect(pluginController.plugins[2]?.manifest.name).toBe('test_2')
  })

  it('should call onTest', async () => {
    const plugin = await pluginController.initPlugin('/plugins/example3')
    await pluginController.testPlugin('test_3', {})
    expect(plugin?.onTest).toHaveBeenCalled()
  })
})
