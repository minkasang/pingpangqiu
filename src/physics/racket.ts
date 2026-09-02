import { Quaternion, Vector3 } from 'three'
import { createRacketSurface } from './surface'
import type { BoxSurface } from './surface'

/** 挡 / 搓 / 攻 / 拉 / 削 五种典型触拍动作 */
export type RacketAction = 'block' | 'push' | 'drive' | 'brush' | 'chop'

export const RACKET_ACTION_LABEL: Record<RacketAction, string> = {
  block: '挡 Block',
  push: '搓 Push',
  drive: '攻 Drive',
  brush: '拉 Brush',
  chop: '削 Chop',
}

export const RACKET_ACTION_ORDER: RacketAction[] = ['block', 'push', 'drive', 'brush', 'chop']

/**
 * 各动作在触球瞬间的球拍速度（单位 m/s）。
 * 接球者站在 +Z 一侧，向前挥拍 = -Z 方向。
 * speed 为用户倍率（0~2），乘在该向量上。
 */
const RACKET_ACTION_VELOCITY: Record<RacketAction, Vector3> = {
  block: new Vector3(0, 0, 0),
  push: new Vector3(0, -0.4, -1.0),
  drive: new Vector3(0, 0.3, -1.8),
  brush: new Vector3(0, 0.9, -1.2),
  chop: new Vector3(0, -0.6, -1.4),
}

export function computeRacketVelocity(action: RacketAction, speed: number, out = new Vector3()): Vector3 {
  return out.copy(RACKET_ACTION_VELOCITY[action]).multiplyScalar(speed)
}

/**
 * 拍面姿态。约定拍面法线为局部 -Z（正对来球）：
 *   pitch > 0 拍面后仰（open，接下旋），< 0 前倾（closed，接上旋）
 *   yaw   > 0 拍面朝向接球者左侧（-X）
 *   roll      绕法线的面内旋转，只影响握拍视觉
 */
export function computeRacketQuaternion(pitchDeg: number, yawDeg: number, rollDeg: number, out = new Quaternion()): Quaternion {
  const deg = Math.PI / 180
  const pitch = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), pitchDeg * deg)
  const yaw = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), yawDeg * deg)
  const roll = new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), rollDeg * deg)
  return out.copy(yaw).multiply(pitch).multiply(roll)
}

export interface RacketControl {
  x: number
  y: number
  z: number
  pitchDeg: number
  yawDeg: number
  rollDeg: number
  action: RacketAction
  /** 动作速度倍率 0~2 */
  speed: number
}

/** 默认拍位：按上旋发球的第二跳落点调好的准备位置 */
export const DEFAULT_RACKET_CONTROL: RacketControl = {
  x: 0,
  y: 0.18,
  z: 1.25,
  pitchDeg: -10,
  yawDeg: 0,
  rollDeg: 0,
  action: 'block',
  speed: 1,
}

export function racketPositionOf(control: RacketControl, out = new Vector3()): Vector3 {
  return out.set(control.x, control.y, control.z)
}

/** 由控制状态构建引擎使用的球拍碰撞表面 */
export function buildRacketSurface(control: RacketControl): BoxSurface {
  return createRacketSurface(
    racketPositionOf(control),
    computeRacketQuaternion(control.pitchDeg, control.yawDeg, control.rollDeg),
    computeRacketVelocity(control.action, control.speed),
  )
}
