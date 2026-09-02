import { Vector3 } from 'three'
import { AIR, BALL, GRAVITY, MAGNUS_COEFFICIENT } from './constants'

/** 球的迎风面积 */
export const BALL_AREA = Math.PI * BALL.radius ** 2

/** 重力 F_g = m·g，方向 -Y */
export function gravityForce(mass = BALL.mass, out = new Vector3()): Vector3 {
  return out.set(0, GRAVITY * mass, 0)
}

/** 空气阻力 F_d = -½·ρ·C_d·A·|v|·v，与速度方向严格相反 */
export function dragForce(velocity: Vector3, out = new Vector3()): Vector3 {
  const speed = velocity.length()
  if (speed === 0) return out.set(0, 0, 0)
  return out.copy(velocity).multiplyScalar(-0.5 * AIR.density * AIR.dragCoefficient * BALL_AREA * speed)
}

/**
 * 马格努斯力 F_m = K · (ω × v)。
 *
 * 方向由 ω × v 唯一决定，这是上旋下沉 / 下旋上飘 / 侧旋侧弯的唯一来源。
 * 没有任何按旋转类型分支的写法。
 */
export function magnusForce(angularVelocity: Vector3, velocity: Vector3, out = new Vector3()): Vector3 {
  return out.copy(angularVelocity).cross(velocity).multiplyScalar(MAGNUS_COEFFICIENT)
}

/** 某一时刻作用在球上的合力 */
export function totalForce(angularVelocity: Vector3, velocity: Vector3, mass = BALL.mass, out = new Vector3()): Vector3 {
  gravityForce(mass, out)
  out.add(dragForce(velocity))
  out.add(magnusForce(angularVelocity, velocity))
  return out
}
