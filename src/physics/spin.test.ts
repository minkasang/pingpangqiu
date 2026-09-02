import { describe, expect, it } from 'vitest'
import { Vector3 } from 'three'
import { angularVelocityFromSpin, rpmOf, spinAxis } from './spin'
import { MAGNUS_COEFFICIENT, RPM_TO_RAD } from './constants'

/** 沿 +Z 飞行的球 */
const FLIGHT = new Vector3(0, 0, 8)

function magnus(type: Parameters<typeof spinAxis>[0], rpm = 3000): Vector3 {
  const omega = angularVelocityFromSpin(type, rpm)
  return omega.clone().cross(FLIGHT).multiplyScalar(MAGNUS_COEFFICIENT)
}

describe('统一旋转向量', () => {
  it('不转球的角速度为零向量', () => {
    expect(angularVelocityFromSpin('none', 3000).length()).toBe(0)
  })

  it('除不转球外，旋转轴均为单位向量', () => {
    const types = ['topspin', 'backspin', 'rightSidespin', 'leftSidespin', 'topRight', 'backRight'] as const
    for (const type of types) {
      expect(spinAxis(type).length()).toBeCloseTo(1, 12)
    }
  })

  it('RPM 与角速度可双向换算', () => {
    const omega = angularVelocityFromSpin('topspin', 3200)
    expect(omega.x).toBeCloseTo(3200 * RPM_TO_RAD, 12)
    expect(rpmOf(omega)).toBeCloseTo(3200, 9)
  })
})

describe('Magnus 方向（决定上旋下沉、侧旋侧弯）', () => {
  it('上旋的 Magnus 力向下', () => {
    const f = magnus('topspin')
    expect(f.x).toBeCloseTo(0, 12)
    expect(f.y).toBeLessThan(0)
    expect(f.z).toBeCloseTo(0, 12)
  })

  it('下旋的 Magnus 力向上', () => {
    const f = magnus('backspin')
    expect(f.y).toBeGreaterThan(0)
  })

  it('右侧旋的 Magnus 力指向 +X（接球者右手边）', () => {
    const f = magnus('rightSidespin')
    expect(f.x).toBeGreaterThan(0)
    expect(f.y).toBeCloseTo(0, 12)
    expect(f.z).toBeCloseTo(0, 12)
  })

  it('左侧旋的 Magnus 力指向 -X（接球者左手边）', () => {
    const f = magnus('leftSidespin')
    expect(f.x).toBeLessThan(0)
  })

  it('侧上旋同时具备下沉与侧弯分量，且不是写死的独立逻辑', () => {
    const f = magnus('topRight')
    expect(f.y).toBeLessThan(0)
    expect(f.x).toBeGreaterThan(0)
  })

  it('侧下旋同时具备上飘与侧弯分量', () => {
    const f = magnus('backRight')
    expect(f.y).toBeGreaterThan(0)
    expect(f.x).toBeGreaterThan(0)
  })

  it('左右侧旋的 Magnus 力大小相等、方向相反', () => {
    const right = magnus('rightSidespin')
    const left = magnus('leftSidespin')
    expect(right.x).toBeCloseTo(-left.x, 12)
  })
})
