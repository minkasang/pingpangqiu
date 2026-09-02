import { describe, expect, it } from 'vitest'
import { Quaternion, Vector3 } from 'three'
import { BALL } from './constants'
import { resolveContact } from './contact'
import { LAUNCH_PROFILES } from './launch'
import { buildRacketSurface, computeRacketQuaternion, computeRacketVelocity } from './racket'
import { SCENARIOS, getScenario } from './scenarios'
import { angularVelocityFromSpin } from './spin'
import { detectSphereBox } from './surface'
import type { BallState } from './types'

const _surface = {
  kind: 'racket' as const,
  center: new Vector3(),
  rotation: new Quaternion(),
  halfExtents: new Vector3(0.075, 0.075, 0.006),
  velocity: new Vector3(),
  restitution: 0.55,
  friction: 0.6,
}

const RACKET_Z = 1.25

/**
 * 在拍面前方构造一个合理的触拍瞬间：按场景 spin 类型 + 旋转方向，
 * 给出贴近真实击球的入球速度与角速度。
 */
function incomingFor(scenarioId: string): { velocity: Vector3; angularVelocity: Vector3 } {
  switch (scenarioId) {
    case 'receiveTopspin':
      // 来球已过最高点，正向接球者一侧下沉
      return {
        velocity: new Vector3(0, -0.4, 5),
        angularVelocity: angularVelocityFromSpin('topspin', 3200),
      }
    case 'receiveBackspin':
      // 来球仍在高弧线上升途中
      return {
        velocity: new Vector3(0, 0.3, 4),
        angularVelocity: angularVelocityFromSpin('backspin', 3200),
      }
    case 'receiveLeftSidespin':
      return {
        velocity: new Vector3(0, 0, 5),
        angularVelocity: angularVelocityFromSpin('leftSidespin', 3200),
      }
    case 'receiveRightSidespin':
      return {
        velocity: new Vector3(0, 0, 5),
        angularVelocity: angularVelocityFromSpin('rightSidespin', 3200),
      }
    default:
      return {
        velocity: new Vector3(0, 0, 5),
        angularVelocity: new Vector3(0, 0, 0),
      }
  }
}

function racketOutcome(scenarioId: string, mode: 'wrong' | 'correct'): Vector3 {
  const scenario = getScenario(scenarioId as 'receiveTopspin' | 'receiveBackspin' | 'receiveLeftSidespin' | 'receiveRightSidespin')
  const control = mode === 'wrong' ? scenario.wrong : scenario.correct
  buildRacketSurface(control)
  _surface.center.set(control.x, control.y, control.z)
  _surface.rotation.copy(
    computeRacketQuaternion(control.pitchDeg, control.yawDeg, control.rollDeg),
  )
  _surface.velocity.copy(computeRacketVelocity(control.action, control.speed))

  const incoming = incomingFor(scenarioId)
  const state: BallState = {
    position: new Vector3(control.x, control.y, RACKET_Z - 0.006 - BALL.radius + 0.004),
    velocity: incoming.velocity,
    angularVelocity: incoming.angularVelocity,
    radius: BALL.radius,
    mass: BALL.mass,
  }
  const detection = detectSphereBox(state.position, state.radius, _surface)
  if (!detection) throw new Error(`${scenarioId}/${mode} 未检测到球拍接触`)
  return resolveContact(state, detection).velocity
}

describe('教学场景：错误 vs 正确接法的方向差异', () => {
  it('4 种场景都存在且形态完整', () => {
    expect(SCENARIOS).toHaveLength(4)
    for (const scenario of SCENARIOS) {
      expect(scenario.label).toBeTruthy()
      expect(scenario.failReason).toBeTruthy()
      expect(scenario.teachReason).toBeTruthy()
    }
  })

  it('接上旋：拍面后仰把球向上推（飞出台），前倾把球向下压（可控）', () => {
    const wrong = racketOutcome('receiveTopspin', 'wrong')
    const correct = racketOutcome('receiveTopspin', 'correct')
    expect(wrong.y).toBeGreaterThan(0)
    expect(correct.y).toBeLessThan(wrong.y)
  })

  it('接下旋：拍面前倾把球往下压（下网），后仰把球往上托（过网）', () => {
    const wrong = racketOutcome('receiveBackspin', 'wrong')
    const correct = racketOutcome('receiveBackspin', 'correct')
    expect(wrong.y).toBeLessThan(0)
    expect(correct.y).toBeGreaterThan(wrong.y)
  })

  it('接左侧旋：不补偿会让球往一侧偏出，补偿后偏转显著减小', () => {
    const wrong = racketOutcome('receiveLeftSidespin', 'wrong')
    const correct = racketOutcome('receiveLeftSidespin', 'correct')
    expect(Math.abs(wrong.x)).toBeGreaterThan(0.1)
    expect(Math.abs(correct.x)).toBeLessThan(Math.abs(wrong.x))
  })

  it('接右侧旋：不补偿会让球往一侧偏出，补偿后偏转显著减小', () => {
    const wrong = racketOutcome('receiveRightSidespin', 'wrong')
    const correct = racketOutcome('receiveRightSidespin', 'correct')
    expect(Math.abs(wrong.x)).toBeGreaterThan(0.1)
    expect(Math.abs(correct.x)).toBeLessThan(Math.abs(wrong.x))
  })

  it('4 种场景的 RPM 都来自真实发射配置文件，确保旋转强度一致', () => {
    for (const scenario of SCENARIOS) {
      expect(LAUNCH_PROFILES[scenario.spin]).toBeDefined()
      expect(scenario.incomingRpm).toBe(3200)
    }
  })
})