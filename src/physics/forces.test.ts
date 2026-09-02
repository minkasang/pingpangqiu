import { describe, expect, it } from 'vitest'
import { Vector3 } from 'three'
import { dragForce, gravityForce, magnusForce } from './forces'
import { BALL, GRAVITY } from './constants'
import { angularVelocityFromSpin } from './spin'

describe('重力', () => {
  it('大小等于 m·g 且指向 -Y', () => {
    const f = gravityForce()
    expect(f.y).toBeCloseTo(BALL.mass * GRAVITY, 12)
    expect(f.x).toBe(0)
    expect(f.z).toBe(0)
  })
})

describe('空气阻力', () => {
  it('方向与速度严格相反', () => {
    const v = new Vector3(3, -2, 7)
    const f = dragForce(v)
    expect(f.clone().normalize().dot(v.clone().normalize())).toBeCloseTo(-1, 12)
  })

  it('静止时阻力为零', () => {
    expect(dragForce(new Vector3(0, 0, 0)).length()).toBe(0)
  })

  it('10 m/s 时量级约 0.039 N（约 1.5 倍重力，符合乒乓球快速减速）', () => {
    const f = dragForce(new Vector3(0, 0, 10))
    expect(f.length()).toBeGreaterThan(0.03)
    expect(f.length()).toBeLessThan(0.05)
    expect(f.length() / (BALL.mass * -GRAVITY)).toBeGreaterThan(1)
  })

  it('大小随速度平方增长', () => {
    const slow = dragForce(new Vector3(0, 0, 5)).length()
    const fast = dragForce(new Vector3(0, 0, 10)).length()
    expect(fast / slow).toBeCloseTo(4, 9)
  })
})

describe('马格努斯力', () => {
  it('同时垂直于角速度与线速度', () => {
    const omega = angularVelocityFromSpin('topRight', 3000)
    const v = new Vector3(1, -2, 8)
    const f = magnusForce(omega, v)
    expect(f.dot(omega)).toBeCloseTo(0, 12)
    expect(f.dot(v)).toBeCloseTo(0, 12)
  })

  it('3000 rpm / 10 m/s 时量级约 0.047 N（约 1.8 倍重力）', () => {
    const omega = angularVelocityFromSpin('topspin', 3000)
    const f = magnusForce(omega, new Vector3(0, 0, 10))
    expect(f.length()).toBeGreaterThan(0.03)
    expect(f.length()).toBeLessThan(0.07)
  })

  it('转速为零时马格努斯力为零', () => {
    const f = magnusForce(new Vector3(0, 0, 0), new Vector3(0, 0, 10))
    expect(f.length()).toBe(0)
  })

  it('方向满足右手定则：ω×v 而非 v×ω', () => {
    // ω = +X，v = +Z，则 ω × v 应指向 -Y
    const f = magnusForce(new Vector3(300, 0, 0), new Vector3(0, 0, 10))
    expect(f.y).toBeLessThan(0)
  })
})
