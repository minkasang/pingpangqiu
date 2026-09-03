import { describe, expect, it } from 'vitest'
import { Vector3 } from 'three'
import { BALL } from './constants'
import { DEFAULT_RACKET_CONTROL } from './racket'
import type { RacketControl } from './racket'
import { MACRO_DIST_MACRO, MACRO_DIST_SLOWDOWN, MACRO_TIME_SCALE, useMacroView } from './macroView'

describe('Macro 触发距离', () => {
  const racket = { ...DEFAULT_RACKET_CONTROL }

  it('球距球拍远时返回 far', () => {
    expect(useMacroView(new Vector3(racket.x, racket.y, racket.z - 1.0), racket, BALL.radius)).toBe('far')
  })

  it('球距球拍在 10cm 边界附近', () => {
    // dist = centerDist - 0.095
    // dist 0.05 边界：centerDist 0.145
    // dist 0.10 边界：centerDist 0.195
    expect(useMacroView(new Vector3(racket.x, racket.y, racket.z - 0.145), racket, BALL.radius)).toBe('slowdown')
    expect(useMacroView(new Vector3(racket.x, racket.y, racket.z - 0.2), racket, BALL.radius)).toBe('far')
  })

  it('球穿过球拍中心（与球拍重合）时返回 macro', () => {
    expect(useMacroView(new Vector3(racket.x, racket.y, racket.z), racket, BALL.radius)).toBe('macro')
  })

  it('距离阈值常量与设计值一致', () => {
    expect(MACRO_DIST_SLOWDOWN).toBeCloseTo(0.1, 12)
    expect(MACRO_DIST_MACRO).toBeCloseTo(0.03, 12)
    expect(MACRO_TIME_SCALE).toBeCloseTo(0.1, 12)
  })

  it('球心偏移 (x, y) 同样影响判定', () => {
    // 计算用的是球心到球拍中心的距离 - 球半径 0.02 - 球拍半径 0.075 = 0.095
    //   dist < 0.03 -> macro
    //   0.03 <= dist < 0.10 -> slowdown
    //   dist >= 0.10 -> far
    expect(useMacroView(new Vector3(racket.x + 0.05, racket.y, racket.z), racket, BALL.radius)).toBe('macro')
    expect(useMacroView(new Vector3(racket.x + 0.15, racket.y, racket.z), racket, BALL.radius)).toBe('slowdown')
    expect(useMacroView(new Vector3(racket.x + 0.5, racket.y, racket.z), racket, BALL.radius)).toBe('far')
  })

  it('函数是纯函数（不修改入参）', () => {
    const racketSnap: RacketControl = { ...racket }
    const originalRacket = { ...racket }
    const pos = new Vector3(racket.x, racket.y, racket.z - 0.05)
    const originalPos = pos.clone()
    void racketSnap
    expect(() => useMacroView(pos, racket, BALL.radius)).not.toThrow()
    expect(pos).toEqual(originalPos)
    expect(racket).toEqual(originalRacket)
  })
})