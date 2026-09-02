import { describe, expect, it } from 'vitest'
import { Quaternion, Vector3 } from 'three'
import { BALL } from './constants'
import { predictTrajectory, TableTennisPhysicsEngine } from './engine'
import { LAUNCH_PROFILES } from './launch'
import { buildRacketSurface, computeRacketQuaternion, computeRacketVelocity, DEFAULT_RACKET_CONTROL } from './racket'
import { angularVelocityFromSpin } from './spin'
import { detectSphereBox } from './surface'
import { resolveContact } from './contact'
import type { BallState, ContactInfo } from './types'

const _racket = new Vector3()
const _quat = new Quaternion()
const _vel = new Vector3()
const _racketSurface = {
  kind: 'racket' as const,
  center: new Vector3(),
  rotation: new Quaternion(),
  halfExtents: new Vector3(0.075, 0.075, 0.006),
  velocity: new Vector3(),
  restitution: 0.55,
  friction: 0.6,
}

function ballInFrontOfRacket(control = DEFAULT_RACKET_CONTROL): BallState {
  buildRacketSurface(control) // verify it builds (smoke)
  _racket.set(control.x, control.y, control.z)
  _vel.copy(computeRacketVelocity(control.action, control.speed))
  _quat.copy(computeRacketQuaternion(control.pitchDeg, control.yawDeg, control.rollDeg))
  _racketSurface.center.copy(_racket)
  _racketSurface.rotation.copy(_quat)
  _racketSurface.velocity.copy(_vel)

  // 把球摆到拍面前方并轻微侵入，保证 detectSphereBox 一定命中
  const halfZ = _racketSurface.halfExtents.z
  return {
    position: new Vector3(0, control.y, control.z - halfZ - BALL.radius + 0.004),
    velocity: new Vector3(0, 0, 6),
    angularVelocity: new Vector3(0, 0, 0),
    radius: BALL.radius,
    mass: BALL.mass,
  }
}

function detectAndResolve(state: BallState) {
  const contact = detectSphereBox(state.position, state.radius, _racketSurface)
  if (!contact) throw new Error('未检测到球拍接触')
  return { contact, result: resolveContact(state, contact as ContactInfo) }
}

describe('球拍接触：挥拍动作对回球的影响', () => {
  it('向前顶拍比静止挡球回球更快', () => {
    const block = detectAndResolve(ballInFrontOfRacket())
    const push = detectAndResolve(ballInFrontOfRacket({
      ...DEFAULT_RACKET_CONTROL,
      action: 'push',
    }))
    // 顶拍回球比挡球更快（即 v_z 更负，因为向 -Z 返回）
    expect(push.result.velocity.z).toBeLessThan(block.result.velocity.z)
  })

  it('托拍（向上挥拍）给球附加明显向上速度', () => {
    // 关掉拍面前倾让测试更易理解：默认的 pitch=-10° 会引入额外的 y 分量
    const control = { ...DEFAULT_RACKET_CONTROL, pitchDeg: 0, rollDeg: 0 }
    const block = detectAndResolve(ballInFrontOfRacket({ ...control, action: 'block' }))
    const lift = detectAndResolve(ballInFrontOfRacket({ ...control, action: 'brush' }))
    expect(lift.result.velocity.y).toBeGreaterThan(block.result.velocity.y)
  })

  it('拍面前倾（pitch < 0）使回球明显偏下、后仰（pitch > 0）使回球明显偏上', () => {
    const open = detectAndResolve(ballInFrontOfRacket({
      ...DEFAULT_RACKET_CONTROL,
      pitchDeg: 30,
    }))
    const closed = detectAndResolve(ballInFrontOfRacket({
      ...DEFAULT_RACKET_CONTROL,
      pitchDeg: -30,
    }))
    expect(open.result.velocity.y).toBeGreaterThan(0)
    expect(closed.result.velocity.y).toBeLessThan(0)
    // 镜像对称：左右后仰大小近似
    expect(open.result.velocity.y).toBeCloseTo(-closed.result.velocity.y, 6)
  })

  it('球拍速度只来自同一个 resolveContact，没有按动作类型分支', () => {
    // 同一位置、同来球、不同球拍速度——结果差异是 resolveContact 的物理结果，不是特判
    const a = detectAndResolve(ballInFrontOfRacket({ ...DEFAULT_RACKET_CONTROL, action: 'drive', speed: 1.5 }))
    const b = detectAndResolve(ballInFrontOfRacket({ ...DEFAULT_RACKET_CONTROL, action: 'block' }))
    expect(a.result.velocity.z).toBeLessThan(b.result.velocity.z)
  })
})

describe('Ghost 预测轨迹：与实际运行逐点一致', () => {
  it('预测轨迹的每个采样点都与用相同初始条件 + 球拍运行的结果一致', () => {
    const spin = 'topspin'
    const setup = {
      position: LAUNCH_PROFILES[spin].position.clone(),
      velocity: LAUNCH_PROFILES[spin].velocity.clone(),
      angularVelocity: angularVelocityFromSpin(spin, 3200),
    }
    const racket = DEFAULT_RACKET_CONTROL
    const racketSurface = buildRacketSurface(racket)

    const predicted = predictTrajectory(setup, [racketSurface], 3.5)

    // 实际运行：使用同样的 setup 与球拍
    const live = new TableTennisPhysicsEngine({ ...setup })
    live.setRacket(
      new Vector3(racket.x, racket.y, racket.z),
      computeRacketQuaternion(racket.pitchDeg, racket.yawDeg, racket.rollDeg),
      computeRacketVelocity(racket.action, racket.speed),
    )

    const sampleEvery = 4
    for (let step = 0, i = 0; i < predicted.length; step += sampleEvery, i += 1) {
      const p = predicted[i]
      if (!p) continue
      for (let k = 0; k < sampleEvery; k += 1) live.step(1 / 600)
      expect(live.state.position.x).toBeCloseTo(p.x, 6)
      expect(live.state.position.y).toBeCloseTo(p.y, 6)
      expect(live.state.position.z).toBeCloseTo(p.z, 6)
    }
  })
})

describe('默认拍位下上旋发球可被挡回', () => {
  it('上旋发球落到默认球拍位置时会触发 racket 接触', () => {
    const spin = 'topspin'
    const setup = {
      position: LAUNCH_PROFILES[spin].position.clone(),
      velocity: LAUNCH_PROFILES[spin].velocity.clone(),
      angularVelocity: angularVelocityFromSpin(spin, 3200),
    }
    const engine = new TableTennisPhysicsEngine({ ...setup })
    while (engine.time < 5) {
      engine.step(1 / 600)
      if (engine.contacts.some((event) => event.kind === 'racket')) return
    }
    throw new Error('默认拍位下上旋发球 5 秒内未碰拍')
  })
})