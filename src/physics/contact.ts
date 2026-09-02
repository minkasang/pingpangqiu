import { Vector3 } from 'three'
import { BALL, BALL_INERTIA } from './constants'
import type { BallState, ContactInfo, ContactResult } from './types'

/**
 * 接触求解。球台与球拍共用同一套公式，不按旋转类型分支。
 *
 *   r_c     = -R·n                      球心 → 接触点
 *   法向    v_n' = -e·v_n
 *   滑移    u = (v - v_拍) 的切向分量 + ω × r_c
 *   止滑冲量 J_stop = |u| / (1/m + R²/I)   （I = ⅔mR² 时为 0.4·m·|u|）
 *   摩擦冲量 J_t = min(μ·J_n, J_stop)，方向 -û
 *   写回    v += (J_t/m)·(-û) + 法向增量
 *           ω += (r_c × J) / I
 *
 * 注意：这是点接触模型。纯侧旋（ω 竖直）在水平台面上接触时，接触点正好落在
 * 旋转轴上，ω × r_c = 0，因此不会在台面产生横向反弹。侧旋的横向效果来自
 * 飞行中的马格努斯力，以及旋转轴不与拍面法线平行时的球拍接触。
 */
export function resolveContact(state: BallState, contact: ContactInfo): ContactResult {
  const velocity = state.velocity.clone()
  const angularVelocity = state.angularVelocity.clone()
  const frictionImpulse = new Vector3()
  const slipVelocity = new Vector3()

  const normal = contact.normal
  /** 球心 → 接触点 */
  const contactOffset = normal.clone().multiplyScalar(-BALL.radius)

  const relative = velocity.clone().sub(contact.surfaceVelocity)
  const approachSpeed = relative.dot(normal)

  // 已在远离接触面时不产生冲量，避免同一次接触被重复求解
  if (approachSpeed >= 0) {
    return { velocity, angularVelocity, frictionImpulse, slipVelocity, normalImpulse: 0 }
  }

  // 接触点处球表面相对接触面的滑移速度
  const spinSurfaceVelocity = angularVelocity.clone().cross(contactOffset)
  const tangential = relative.clone().addScaledVector(normal, -approachSpeed)
  slipVelocity.copy(tangential).add(spinSurfaceVelocity)

  const normalImpulse = -BALL.mass * (1 + contact.restitution) * approachSpeed
  velocity.addScaledVector(normal, -(1 + contact.restitution) * approachSpeed)

  const slipSpeed = slipVelocity.length()
  if (slipSpeed > 1e-12) {
    const stopImpulse = slipSpeed / (1 / BALL.mass + BALL.radius ** 2 / BALL_INERTIA)
    const magnitude = Math.min(contact.friction * normalImpulse, stopImpulse)
    frictionImpulse.copy(slipVelocity).normalize().multiplyScalar(-magnitude)
    velocity.addScaledVector(frictionImpulse, 1 / BALL.mass)
    angularVelocity.addScaledVector(contactOffset.clone().cross(frictionImpulse), 1 / BALL_INERTIA)
  }

  return { velocity, angularVelocity, frictionImpulse, slipVelocity, normalImpulse }
}
