import { describe, expect, it, vi } from 'vitest'
import { Task } from '../../server/services/taskManager'

describe('TaskManager', () => {
  describe('Task', () => {
    it('calls the method immediately when callAtStart is true', () => {
      const method = vi.fn().mockResolvedValue(undefined)
      const task = new Task({
        name: 'call immediately',
        method,
        callAtStart: true
      })
      task.process()
      expect(method).toHaveBeenCalledTimes(1)
    })

    it('waits repeatDelay ticks before processing', () => {
      const method = vi.fn().mockResolvedValue(undefined)
      const task = new Task({
        name: 'test',
        method,
        repeat: true,
        repeatDelay: 3
      })
      task.process()
      expect(method).not.toHaveBeenCalled()
      task.process()
      expect(method).not.toHaveBeenCalled()
      task.process()
      expect(method).toHaveBeenCalledTimes(1)
    })

    it('repeats after repeatDelay ticks', () => {
      const method = vi.fn().mockResolvedValue(undefined)
      const task = new Task({
        name: 'test',
        method,
        repeat: true,
        repeatDelay: 2
      })
      task.process()
      task.process()
      task.process()
      expect(method).toHaveBeenCalledTimes(1)
      task.process()
      task.process()
      expect(method).toHaveBeenCalledTimes(2)
    })

    it('executes a non-repeating task once', () => {
      const method = vi.fn().mockResolvedValue(undefined)
      const task = new Task({
        name: 'test',
        method
      })

      task.process()

      expect(method).toHaveBeenCalledTimes(1)
    })

    it('uses retries when a non-repeating task fails', async () => {
      const method = vi.fn().mockRejectedValue(new Error('boom'))

      const task = new Task({
        name: 'fails',
        method,
        retries: [2, 3]
      })

      const ret = task.process()
      await expect(ret).rejects.toThrow('boom')

      expect(method).toHaveBeenCalledTimes(1)
      expect(task.processInNTick).toBe(2)
      expect(task.retries).toEqual([3])
    })

    it('does not retry when a non-repeating task succeeds', async () => {
      const method = vi.fn().mockResolvedValue(true)
      const task = new Task({
        name: 'succeeds',
        method,
        retries: [2, 3]
      })
      await task.process()
      await task.process()
      await task.process()
      expect(method).toHaveBeenCalledTimes(1)
      expect(task.completed).toBe(true)
      expect(task.retries).toEqual([2, 3])
    })

    it('retries a failed task and completes when it succeeds', async () => {
      const method = vi.fn()
        .mockRejectedValueOnce(new Error('boom'))
        .mockResolvedValueOnce(true)

      const task = new Task({
        name: 'retry-then-succeed',
        method,
        retries: [2, 3]
      })

      await expect(task.process()).rejects.toThrow('boom')
      expect(task.processInNTick).toBe(2)
      expect(task.retries).toEqual([3])
      expect(task.completed).toBe(false)

      await task.process()
      await task.process()
      expect(method).toHaveBeenCalledTimes(2)
      expect(task.completed).toBe(true)
    })
  })
})
