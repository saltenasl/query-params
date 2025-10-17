import { describe, it, expect } from 'vitest'
import { isNode, isBrowser } from './platform'

describe('platform detection', () => {
  describe('isNode()', () => {
    it('should return true in Node.js environment', () => {
      // We're running in Node.js via vitest
      expect(isNode()).toBe(true)
    })

    it('should return false when process is undefined', () => {
      const originalProcess = global.process
      // @ts-expect-error - intentionally setting to undefined for test
      global.process = undefined
      
      expect(isNode()).toBe(false)
      
      global.process = originalProcess
    })

    it('should return false when process.versions is undefined', () => {
      const originalProcess = global.process
      // @ts-expect-error - intentionally modifying process for test
      global.process = { versions: undefined }
      
      expect(isNode()).toBe(false)
      
      global.process = originalProcess
    })

    it('should return false when process.versions.node is undefined', () => {
      const originalProcess = global.process
      // @ts-expect-error - intentionally modifying process for test
      global.process = { versions: {} }
      
      expect(isNode()).toBe(false)
      
      global.process = originalProcess
    })
  })

  describe('isBrowser()', () => {
    it('should return false in Node.js environment', () => {
      // We're running in Node.js via vitest
      expect(isBrowser()).toBe(false)
    })

    it('should return true when window and window.document exist', () => {
      // Mock browser environment
      // @ts-expect-error - mocking window for test
      global.window = { document: {} }
      
      expect(isBrowser()).toBe(true)
      
      // @ts-expect-error - cleaning up
      delete global.window
    })

    it('should return false when window is undefined', () => {
      expect(isBrowser()).toBe(false)
    })

    it('should return false when window.document is undefined', () => {
      // @ts-expect-error - mocking window for test
      global.window = {}
      
      expect(isBrowser()).toBe(false)
      
      // @ts-expect-error - cleaning up
      delete global.window
    })
  })
})
