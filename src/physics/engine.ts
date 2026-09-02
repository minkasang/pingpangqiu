import { Quaternion, Vector3 } from 'three'
import { BALL, BALL_INERTIA, PHYSICS_DT } from './constants'
import { resolveContact } from './contact'
import { dragForce, gravityForce, magnusForce } from './forces'
import { createFloorSurface, createTableSurface, detectSphereBox } from './surface'
import type { BoxSurface } from './surface'
import type { BallState, ContactEvent, TrajectorySample } from './types'

export interface EngineSetup {
  position: Vector3
  velocity: Vector3
  angularVelocity: Vector3
  /** 额外表面，例如球拍 */
  surfaces?: BoxSurface[]
}

const _force = new Vector3()
const _step = new Vector3()
const _axis = new Vector3()
const _rotation = new Quaternion()

/**
 * 物理真相的唯一持有者。只负责积分与接触响应，不做任何渲染相关的事情，
 * 因此可以在 vitest 里裸跑，方向正确性可以被测试锁死。
 *
 * - 定步长积分（PHYSICS_DT），保证时间轴拖动可复现
 * - 力：重力 + 空气阻力 + 马格努斯力
 * - 接触：由检测给出法线与接触点，响应一律走 resolveContact
 */
export class TableTennisPhysicsEngine {
  readonly state: BallState
  /**
   * 球的姿态。虽然只用于显示，但必须和物理时间同步推进，
   * 否则慢放 / 逐帧时表面标记的转动速度会和实际转速不一致。
   */
  readonly orientation = new Quaternion()
  time = 0
  trajectory: TrajectorySample[] = []
  contacts: ContactEvent[] = []
  surfaces: BoxSurface[] = [createTableSurface(), createFloorSurface()]

  private readonly setup: EngineSetup
  private accumulator = 0
  private nextSampleTime = 0
  private nextContactId = 1

  /** 轨迹采样间隔（秒） */
  readonly sampleInterval = 1 / 120
  /** 轨迹保留的最大采样数，避免长时间运行后无限增长 */
  readonly maxSamples = 4000

  constructor(setup: EngineSetup) {
    this.setup = setup
    this.state = {
      position: setup.position.clone(),
      velocity: setup.velocity.clone(),
      angularVelocity: setup.angularVelocity.clone(),
      radius: BALL.radius,
      mass: BALL.mass,
    }
    if (setup.surfaces) this.surfaces.push(...setup.surfaces)
    this.recordSample()
  }

  reset(): void {
    this.state.position.copy(this.setup.position)
    this.state.velocity.copy(this.setup.velocity)
    this.state.angularVelocity.copy(this.setup.angularVelocity)
    this.orientation.identity()
    this.time = 0
    this.accumulator = 0
    this.nextSampleTime = 0
    this.trajectory = []
    this.contacts = []
    this.nextContactId = 1
    this.recordSample()
  }

  /** 按真实经过时间推进，内部拆成固定步长，保证结果可复现 */
  advance(elapsed: number): void {
    this.accumulator += elapsed
    let guard = 0
    while (this.accumulator >= PHYSICS_DT && guard < 10000) {
      this.step(PHYSICS_DT)
      this.accumulator -= PHYSICS_DT
      guard += 1
    }
  }

  /** 单个固定步长的积分 */
  step(dt: number): void {
    const { velocity, angularVelocity, position } = this.state

    // 半隐式欧拉：先按合力更新速度，再用新速度更新位置
    _force.set(0, 0, 0)
    _force.add(gravityForce(this.state.mass, _step))
    _force.add(dragForce(velocity, _step))
    _force.add(magnusForce(angularVelocity, velocity, _step))

    velocity.addScaledVector(_force, dt / this.state.mass)
    position.addScaledVector(velocity, dt)
    this.time += dt

    // 飞行中无外力矩，角速度保持不变（马格努斯力不做功）
    this.advanceOrientation(dt)
    this.resolveContacts()
    this.maybeRecordSample()
  }

  private advanceOrientation(dt: number): void {
    const { angularVelocity } = this.state
    const speed = angularVelocity.length()
    if (speed < 1e-9) return
    _axis.copy(angularVelocity).divideScalar(speed)
    _rotation.setFromAxisAngle(_axis, speed * dt)
    this.orientation.premultiply(_rotation)
  }

  private resolveContacts(): void {
    for (const surface of this.surfaces) {
      const contact = detectSphereBox(this.state.position, this.state.radius, surface)
      if (!contact) continue

      const before = {
        velocity: this.state.velocity.clone(),
        angularVelocity: this.state.angularVelocity.clone(),
      }

      // 沿来向把球退回到真实接触时刻。不能沿法线推出，那会凭空增加重力势能。
      const approach = -this.state.velocity.dot(contact.normal)
      if (approach > 1e-6) {
        this.state.position.addScaledVector(this.state.velocity, -contact.penetration / approach)
      } else {
        this.state.position.addScaledVector(contact.normal, contact.penetration)
      }

      const result = resolveContact(this.state, contact)
      this.state.velocity.copy(result.velocity)
      this.state.angularVelocity.copy(result.angularVelocity)

      this.contacts.push({
        id: this.nextContactId++,
        kind: surface.kind,
        time: this.time,
        point: contact.point.clone(),
        normal: contact.normal.clone(),
        before,
        after: {
          velocity: this.state.velocity.clone(),
          angularVelocity: this.state.angularVelocity.clone(),
        },
        frictionImpulse: result.frictionImpulse.clone(),
        slipVelocity: result.slipVelocity.clone(),
      })
    }
  }

  private maybeRecordSample(): void {
    if (this.time < this.nextSampleTime) return
    this.recordSample()
    this.nextSampleTime = this.time + this.sampleInterval
  }

  private recordSample(): void {
    this.trajectory.push({ position: this.state.position.clone(), time: this.time })
    if (this.trajectory.length > this.maxSamples) this.trajectory.shift()
  }

  /** 平动动能 + 转动动能 + 重力势能，用于验证能量单调不增 */
  mechanicalEnergy(groundY = 0): number {
    const { velocity, angularVelocity, position, mass } = this.state
    const linear = 0.5 * mass * velocity.lengthSq()
    const rotational = 0.5 * BALL_INERTIA * angularVelocity.lengthSq()
    const potential = mass * 9.81 * (position.y - groundY)
    return linear + rotational + potential
  }
}
