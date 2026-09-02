import { describe, expect, it } from 'vitest'
import { Vector3 } from 'three'
import { TableTennisPhysicsEngine } from './engine'
import { BALL, PHYSICS_DT, SURFACE, TABLE } from './constants'
import { LAUNCH_PROFILES } from './launch'
import { angularVelocityFromSpin, SPIN_LIBRARY } from './spin'
import type { ContactEvent, SpinType } from './types'

/** 落点在对手一侧、球网之前，保证测试对象是球台接触而不是球网接触 */
const START = new Vector3(0, 0.3, -0.72)
const LAUNCH = new Vector3(0, -2, 6)

function makeEngine(spin: SpinType, rpm = 4000): TableTennisPhysicsEngine {
  return new TableTennisPhysicsEngine({
    position: START.clone(),
    velocity: LAUNCH.clone(),
    angularVelocity: angularVelocityFromSpin(spin, rpm),
  })
}

function firstContact(spin: SpinType, rpm = 4000): ContactEvent {
  const engine = makeEngine(spin, rpm)
  while (engine.time < 3) {
    engine.step(PHYSICS_DT)
    const table = engine.contacts.find((event) => event.kind === 'table')
    if (table) return table
  }
  throw new Error(`${spin} 在 3 秒内未产生任何球台接触`)
}

describe('端到端：旋转决定落台后的水平速度', () => {
  it('上旋落台后加速、下旋落台后减速', () => {
    const top = firstContact('topspin')
    const back = firstContact('backspin')

    expect(top.after.velocity.z).toBeGreaterThan(top.before.velocity.z)
    expect(back.after.velocity.z).toBeLessThan(back.before.velocity.z)
  })

  it('落台前后的水平速度变化量：上旋为正、下旋为负', () => {
    const delta = (spin: SpinType) => {
      const contact = firstContact(spin)
      return contact.after.velocity.z - contact.before.velocity.z
    }

    expect(delta('topspin')).toBeGreaterThan(0)
    expect(delta('none')).toBeLessThan(0)
    expect(delta('backspin')).toBeLessThan(0)
    expect(delta('topspin')).toBeGreaterThan(delta('backspin'))
  })

  it('摩擦足以消除滑移时，接触后满足纯滚动条件 v_t = ω·R', () => {
    // 这是对整个切向求解最强的自检：滑移被完全吃掉后必须刚好进入滚动
    const contact = firstContact('topspin')
    expect(contact.after.velocity.z).toBeCloseTo(contact.after.angularVelocity.x * BALL.radius, 6)
  })

  it('上旋转速越高，前窜越明显', () => {
    const slow = firstContact('topspin', 2000).after.velocity.z
    const fast = firstContact('topspin', 6000).after.velocity.z
    expect(fast).toBeGreaterThan(slow)
  })
})

describe('端到端：法向反弹与接触记录', () => {
  it('法向速度按恢复系数反向', () => {
    const contact = firstContact('none')
    expect(contact.after.velocity.y).toBeCloseTo(
      -contact.before.velocity.y * SURFACE.table.restitution,
      6,
    )
  })

  it('台面接触法线为 +Y 且接触点落在台面高度', () => {
    const contact = firstContact('topspin')
    expect(contact.kind).toBe('table')
    expect(contact.normal.x).toBeCloseTo(0, 9)
    expect(contact.normal.y).toBeCloseTo(1, 9)
    expect(contact.normal.z).toBeCloseTo(0, 9)
    expect(contact.point.y).toBeCloseTo(0, 9)
  })

  it('接触记录里保存了摩擦冲量与滑移速度', () => {
    const contact = firstContact('topspin')
    expect(contact.frictionImpulse.length()).toBeGreaterThan(0)
    expect(contact.slipVelocity.z).toBeLessThan(0)
  })
})

describe('能量与积分稳定性', () => {
  it('总机械能单调不增（摩擦与恢复系数只耗能）', () => {
    const engine = makeEngine('topspin')
    let previous = engine.mechanicalEnergy()
    for (let i = 0; i < 1200; i += 1) {
      engine.step(PHYSICS_DT)
      const energy = engine.mechanicalEnergy()
      expect(energy).toBeLessThanOrEqual(previous + 1e-7)
      previous = energy
    }
  })

  it('球在台面上方时不会陷入台面', () => {
    // 球飞出台端后落到地面，y 为负是合法的，只在台面上方时才约束
    const engine = makeEngine('topspin')
    for (let i = 0; i < 900; i += 1) {
      engine.step(PHYSICS_DT)
      const { x, y, z } = engine.state.position
      const overTable = Math.abs(x) < TABLE.width / 2 && Math.abs(z) < TABLE.length / 2
      if (overTable) expect(y).toBeGreaterThan(BALL.radius - 1e-6)
    }
  })

  it('轨迹采样按时间递增', () => {
    const engine = makeEngine('topspin')
    engine.advance(0.5)
    expect(engine.trajectory.length).toBeGreaterThan(10)
    for (let i = 1; i < engine.trajectory.length; i += 1) {
      const prev = engine.trajectory[i - 1]
      const curr = engine.trajectory[i]
      if (!prev || !curr) throw new Error('轨迹采样缺失')
      expect(curr.time).toBeGreaterThan(prev.time)
    }
  })

  it('advance 与逐次 step 结果一致（固定步长可复现）', () => {
    const stepped = makeEngine('topspin')
    for (let i = 0; i < 300; i += 1) stepped.step(PHYSICS_DT)
    const advanced = makeEngine('topspin')
    advanced.advance(300 * PHYSICS_DT)

    expect(advanced.time).toBeCloseTo(stepped.time, 12)
    expect(advanced.state.position.distanceTo(stepped.state.position)).toBeCloseTo(0, 12)
  })
})

describe('发球规则合规性：先落发球方台面，过网，再落接球方台面', () => {
  for (const spin of SPIN_LIBRARY) {
    it(`${spin} 发球第一落点在发球方（-Z），第二落点在接球方（+Z）`, () => {
      const profile = LAUNCH_PROFILES[spin]
      const engine = new TableTennisPhysicsEngine({
        position: profile.position.clone(),
        velocity: profile.velocity.clone(),
        angularVelocity: angularVelocityFromSpin(spin, 3200),
      })

      while (engine.time < 5) {
        engine.step(PHYSICS_DT)
        const tableBounces = engine.contacts.filter((event) => event.kind === 'table')
        if (tableBounces.length >= 2) break
      }

      const bounces = engine.contacts.filter((event) => event.kind === 'table')
      const first = bounces[0]
      const second = bounces[1]
      if (!first || !second) throw new Error(`${spin} 发球在 5 秒内未完成两次台面弹跳`)

      expect(first.point.z).toBeLessThan(0)
      expect(Math.abs(first.point.z)).toBeLessThan(TABLE.length / 2)
      expect(second.point.z).toBeGreaterThan(0)
      expect(second.point.z).toBeLessThan(TABLE.length / 2)
    })
  }
})

describe('重置', () => {
  it('reset 后回到初始状态', () => {
    const engine = makeEngine('backspin')
    engine.advance(0.8)
    engine.reset()

    expect(engine.time).toBe(0)
    expect(engine.contacts.length).toBe(0)
    expect(engine.state.position.distanceTo(START)).toBeCloseTo(0, 12)
    expect(engine.state.velocity.distanceTo(LAUNCH)).toBeCloseTo(0, 12)
  })
})
