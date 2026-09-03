import { describe, expect, it } from 'vitest'
import { CAMERA_KEY_MAP } from './useKeyboardShortcuts'

describe('useKeyboardShortcuts', () => {
  it('maps numeric keys 1-5 to proper camera presets', () => {
    expect(CAMERA_KEY_MAP['1']).toBe('player')
    expect(CAMERA_KEY_MAP['2']).toBe('side')
    expect(CAMERA_KEY_MAP['3']).toBe('top')
    expect(CAMERA_KEY_MAP['4']).toBe('ball')
    expect(CAMERA_KEY_MAP['5']).toBe('contact')
  })
})
