import { describe, expect, it } from 'vitest'
import { Vector3 } from 'three'
import { BALL_AREA, dragForce, gravityForce, magnusForce } from './forces'
import { AIR, BALL, GRAVITY } from './constants'
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

  it('隐含升力系数落在乒乓球实测范围（C_L ≈ 0.1~0.3）', () => {
    const omega = angularVelocityFromSpin('topspin', 3000)
    const v = new Vector3(0, 0, 10)
    const f = magnusForce(omega, v)
    const cl = f.length() / (0.5 * AIR.density * BALL_AREA * v.lengthSq())
    const spinRatio = (omega.length() * BALL.radius) / v.length()

    expect(spinRatio).toBeGreaterThan(0.5)
    expect(cl).toBeGreaterThan(0.05)
    expect(cl).toBeLessThan(0.4)
  })

  it('升力系数与旋转参数成正比（一阶马格努斯模型的定义性质）', () => {
    const probe = (rpm: number, speed: number) => {
      const omega = angularVelocityFromSpin('topspin', rpm)
      const q = 0.5 * AIR.density * BALL_AREA * speed ** 2
      const cl = magnusForce(omega, new Vector3(0, 0, speed)).length() / q
      const spinRatio = (omega.length() * BALL.radius) / speed
      return cl / spinRatio
    }
    expect(probe(3000, 10)).toBeCloseTo(probe(6000, 15), 9)
  })

  it('6000 rpm / 15 m/s 时马格努斯力超过重力（强上旋会明显下扎）', () => {
    const f = magnusForce(angularVelocityFromSpin('topspin', 6000), new Vector3(0, 0, 15))
    expect(f.length()).toBeGreaterThan(BALL.mass * 9.81)
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
