import { describe, expect, it } from 'vitest'
import { Vector3 } from 'three'
import { resolveContact } from './contact'
import { BALL, SURFACE } from './constants'
import { angularVelocityFromSpin, rpmOf } from './spin'
import type { BallState, ContactInfo } from './types'

function tableContact(): ContactInfo {
  return {
    point: new Vector3(0, 0, 0),
    normal: new Vector3(0, 1, 0),
    penetration: 0,
    surfaceVelocity: new Vector3(0, 0, 0),
    restitution: SURFACE.table.restitution,
    friction: SURFACE.table.friction,
  }
}

/** 接球者位于 +Z，拍面法线指向 -Z（正对来球）的竖直球拍 */
function verticalRacketContact(): ContactInfo {
  return {
    point: new Vector3(0, 0, 1.2),
    normal: new Vector3(0, 0, -1),
    penetration: 0,
    surfaceVelocity: new Vector3(0, 0, 0),
    restitution: SURFACE.racket.restitution,
    friction: SURFACE.racket.friction,
  }
}

function ball(velocity: Vector3, angularVelocity: Vector3): BallState {
  return {
    position: new Vector3(0, BALL.radius, 0),
    velocity: velocity.clone(),
    angularVelocity: angularVelocity.clone(),
    radius: BALL.radius,
    mass: BALL.mass,
  }
}

describe('球台接触', () => {
  it('上旋落台后水平加速（往前窜）且转速衰减', () => {
    const incoming = new Vector3(0, -3, 6)
    const result = resolveContact(ball(incoming, angularVelocityFromSpin('topspin', 4000)), tableContact())

    // 接触点表面速度因旋转指向 -Z，滑移为负 → 摩擦冲量沿 +Z
    expect(result.slipVelocity.z).toBeLessThan(0)
    expect(result.frictionImpulse.z).toBeGreaterThan(0)
    expect(result.velocity.z).toBeGreaterThan(incoming.z)
    expect(rpmOf(result.angularVelocity)).toBeLessThan(4000)
  })

  it('下旋落台后水平减速', () => {
    const incoming = new Vector3(0, -3, 6)
    const result = resolveContact(ball(incoming, angularVelocityFromSpin('backspin', 4000)), tableContact())

    expect(result.slipVelocity.z).toBeGreaterThan(0)
    expect(result.frictionImpulse.z).toBeLessThan(0)
    expect(result.velocity.z).toBeLessThan(incoming.z)
  })

  it('法向按恢复系数反弹，切向不受法向影响', () => {
    const incoming = new Vector3(0, -5, 0)
    const result = resolveContact(ball(incoming, new Vector3(0, 0, 0)), tableContact())

    expect(result.velocity.y).toBeCloseTo(5 * SURFACE.table.restitution, 12)
    expect(result.velocity.x).toBeCloseTo(0, 12)
    expect(result.velocity.z).toBeCloseTo(0, 12)
  })

  it('无旋球落台时摩擦纯减速', () => {
    const incoming = new Vector3(0, -3, 6)
    const result = resolveContact(ball(incoming, new Vector3(0, 0, 0)), tableContact())
    expect(result.velocity.z).toBeLessThan(incoming.z)
    expect(result.velocity.z).toBeGreaterThan(0)
  })

  it('纯侧旋落台不产生横向速度（点接触模型的正确结果）', () => {
    // ω 竖直时接触点正好落在旋转轴上，ω × r_c = 0；
    // 侧旋的横向效果来自飞行中的马格努斯力与球拍接触，而非台面反弹。
    const result = resolveContact(
      ball(new Vector3(0, -3, 6), angularVelocityFromSpin('rightSidespin', 4000)),
      tableContact(),
    )
    expect(result.velocity.x).toBeCloseTo(0, 12)
  })

  it('远离接触面时不产生冲量', () => {
    const leaving = new Vector3(0, 3, 6)
    const result = resolveContact(ball(leaving, angularVelocityFromSpin('topspin', 4000)), tableContact())
    expect(result.normalImpulse).toBe(0)
    expect(result.velocity.equals(leaving)).toBe(true)
  })
})

describe('球拍接触', () => {
  it('上旋球撞竖直拍面被摩擦向上带（所以拍面不压会飞出台）', () => {
    const incoming = new Vector3(0, -1, 8)
    const result = resolveContact(ball(incoming, angularVelocityFromSpin('topspin', 4000)), verticalRacketContact())

    expect(result.slipVelocity.y).toBeLessThan(0)
    expect(result.frictionImpulse.y).toBeGreaterThan(0)
    expect(result.velocity.y).toBeGreaterThan(incoming.y)
  })

  it('下旋球撞竖直拍面被摩擦向下带（所以拍面不亮会下网）', () => {
    const incoming = new Vector3(0, -1, 8)
    const result = resolveContact(ball(incoming, angularVelocityFromSpin('backspin', 4000)), verticalRacketContact())

    expect(result.frictionImpulse.y).toBeLessThan(0)
    expect(result.velocity.y).toBeLessThan(incoming.y)
  })

  it('右侧旋撞竖直拍面向 -X 偏出', () => {
    const result = resolveContact(
      ball(new Vector3(0, -1, 8), angularVelocityFromSpin('rightSidespin', 4000)),
      verticalRacketContact(),
    )
    expect(result.velocity.x).toBeLessThan(0)
  })

  it('左侧旋撞竖直拍面向 +X 偏出', () => {
    const result = resolveContact(
      ball(new Vector3(0, -1, 8), angularVelocityFromSpin('leftSidespin', 4000)),
      verticalRacketContact(),
    )
    expect(result.velocity.x).toBeGreaterThan(0)
  })

  it('左右侧旋的偏出方向相反、大小对称', () => {
    const incoming = new Vector3(0, -1, 8)
    const right = resolveContact(ball(incoming, angularVelocityFromSpin('rightSidespin', 4000)), verticalRacketContact())
    const left = resolveContact(ball(incoming, angularVelocityFromSpin('leftSidespin', 4000)), verticalRacketContact())
    expect(right.velocity.x).toBeCloseTo(-left.velocity.x, 12)
  })

  it('球被拍面弹回，法向速度反向', () => {
    const result = resolveContact(ball(new Vector3(0, -1, 8), new Vector3(0, 0, 0)), verticalRacketContact())
    expect(result.velocity.z).toBeLessThan(0)
  })
})
