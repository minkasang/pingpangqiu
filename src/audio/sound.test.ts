import { describe, expect, it, vi } from 'vitest'
import { SoundEngine } from './sound'

describe('SoundEngine', () => {
  it('handles enable/disable state toggling', () => {
    const engine = new SoundEngine()
    expect(engine.isEnabled()).toBe(true)
    engine.setEnabled(false)
    expect(engine.isEnabled()).toBe(false)
    engine.setEnabled(true)
    expect(engine.isEnabled()).toBe(true)
  })

  it('safely no-ops in non-browser/node environment without audio context', () => {
    const engine = new SoundEngine()
    expect(() => engine.playTableBounce(3.0)).not.toThrow()
    expect(() => engine.playRacketHit(4.0, 3000)).not.toThrow()
    expect(() => engine.playNetTick(1.5)).not.toThrow()
  })

  it('synthesizes sounds when AudioContext is provided', () => {
    const mockOsc = {
      type: '',
      frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    }
    const mockGain = {
      gain: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: vi.fn(),
    }
    const mockCtx = {
      currentTime: 10,
      state: 'running',
      createOscillator: vi.fn(() => mockOsc),
      createGain: vi.fn(() => mockGain),
      destination: {},
    }

    const originalWindow = globalThis.window
    globalThis.window = {
      AudioContext: vi.fn(() => mockCtx) as unknown as typeof AudioContext,
    } as unknown as Window & typeof globalThis

    try {
      const engine = new SoundEngine()
      engine.playTableBounce(3.5)
      expect(mockCtx.createOscillator).toHaveBeenCalled()
      expect(mockCtx.createGain).toHaveBeenCalled()
      expect(mockOsc.start).toHaveBeenCalled()

      engine.playRacketHit(5.0, 4000)
      expect(mockOsc.type).toBe('triangle')

      engine.playNetTick(2.0)
      expect(mockOsc.type).toBe('square')

      engine.setEnabled(false)
      const callCount = mockCtx.createOscillator.mock.calls.length
      engine.playTableBounce(3.0)
      expect(mockCtx.createOscillator.mock.calls.length).toBe(callCount)
    } finally {
      globalThis.window = originalWindow
    }
  })
})
